import * as PDFDocument from "pdfkit";
import * as fs from "fs";
import * as admin from "firebase-admin";
import * as _ from "lodash";
import * as dayjs from "dayjs";
import { Discussion, DiscussionRequest } from "../interfaces/discussions";
import { User } from "../interfaces/users";
import axios from "axios";
import { Comment } from "../interfaces/comments";

interface ScreenshotsProps {
  discussion: Discussion;
}

interface PdfProps {
  submissionId?: string;
  discussion: Discussion;
  users: Record<string, User>;
}

const styles = {
  paragraph: {
    fontSize: 12,
    lineGap: 12,
  },
  header: {
    fontSize: 32,
    lineGap: 38,
  },
  subheader: {
    fontSize: 24,
    lineGap: 12,
  },
  title: {
    fontSize: 48,
    lineGap: 38,
  },
};

const colors = {
  black: "#222222",
  gray: "#8c8c8c",
};

const margin = 36;

export const downloadScreenshots = async ({ discussion }: ScreenshotsProps) => {
  // const dir = `/tmp/${discussion.id}`;
  // if (!fs.existsSync(dir)) {
  //   fs.mkdirSync(dir);
  // }

  async function fetchImage(src: string, id: string) {
    return await new Promise<any>(async (resolve) => {
      const writer = fs.createWriteStream(`/tmp/${discussion.id}-${id}.jpg`, { autoClose: true });
      const response = await axios.get(src, {
        responseType: "stream",
      });

      response.data.pipe(writer);

      writer.on("finish", async () => {
        writer.close();
        resolve();
      });
    });
  }

  const imagePromises = Object.values(discussion.requests)
    .filter((r) => r.screenShotUrl)
    .map((request: DiscussionRequest) => fetchImage(request.screenShotUrl as string, request.id));

  await Promise.all(imagePromises);
  return;
};

export const createPdf = async ({ discussion, submissionId, users }: PdfProps) => {
  const getUser = (userId: string): User => users[userId];

  const file = admin.storage().bucket().file(`submissions/${discussion.id}/${submissionId}.pdf`);

  return await new Promise<any>(async (resolve, reject) => {
    const setStyle = (style: any) => {
      if (style.fontSize) {
        doc.fontSize(style.fontSize);
      }
    };

    const paragraph = (text: string, options = {}) => {
      setStyle(styles.paragraph);
      doc.text(text, { ...options, lineGap: styles.paragraph.lineGap });
      doc.moveDown();
    };

    const header = (text: string, options = {}) => {
      setStyle(styles.header);
      doc.text(text, { ...options, lineGap: styles.header.lineGap });
      doc.moveDown();
    };

    const subheader = (text: string, options = {}) => {
      setStyle(styles.subheader);
      doc.text(text, { ...options, lineGap: styles.subheader.lineGap });
      doc.moveDown();
    };

    const title = (text: string, options = {}) => {
      setStyle(styles.title);
      doc.text(text, { ...options, lineGap: styles.title.lineGap });
      doc.moveDown();
    };
    const doc = new PDFDocument({ margin: margin });

    // doc.pipe(fs.createWriteStream("./file.pdf")); // write to PDF

    const writeStream = file.createWriteStream({
      resumable: false,
      contentType: "application/pdf",
    });

    const buffers: any = [];
    doc.on("data", buffers.push.bind(buffers));

    writeStream.on("finish", async () => {
      console.log("finished writing");
      // const pdfData = Buffer.concat(buffers).toString("base64");

      // const url = await file.getSignedUrl({ action: "read", expires: "03-09-3000" });
      const url =
        "https://firebasestorage.googleapis.com/v0/b/chimpee-app.appspot.com/o/submissions%2Fsample-submission.pdf?alt=media&token=b25b7127-b06b-45b2-99fe-64374edc48fc";
      // return url;

      const downloadedResult = await axios.get(url, {
        responseType: "arraybuffer",
      });

      resolve({
        pdfUrl: url,
        pdfDoc: Buffer.from(downloadedResult.data, "binary").toString("base64"),
      });
    });

    doc.pipe(writeStream);

    doc.font("Times-Roman");

    title("Hello world3!");

    const renderComments = (comments: Record<string, Comment> | undefined, level = 0) => {
      if (!comments) {
        return;
      }

      for (const comment of Object.values(comments)) {
        // paragraph(comment.content)
        const user = getUser(comment.authorId);
        writeMeta(user, comment.time);

        setStyle(styles.paragraph);
        doc.text(comment.content, Math.min((doc.options.margin || 0) + level * 10, 600));
        renderComments(comment.replies, level + 1);
      }
    };

    const writeMeta = (user: User, time: number) => {
      setStyle(styles.paragraph);
      doc
        .fillColor(colors.black)
        .text(`${dayjs.unix(time).format("YYYY.MM.DD HH:mm")}`, {
          // width: 465,
          continued: true,
        })
        .fillColor(colors.gray)
        .text(" | ", {
          // width: 465,
          continued: true,
        })
        .fillColor(colors.black)
        .text(`${user.firstName} ${user.lastName}, ${user.role} @ ${user.organisation}`, {
          width: 465,
          continued: false,
        });
      doc.fillColor(colors.black);
    };

    const writeRequests = async (discussion: Discussion, users: any) => {
      if (!discussion.requests) return;
      const requests = _.sortBy(Object.values(discussion.requests), "time");
      for (const request of requests) {
        const user = getUser(request.authorUserId);

        subheader(request.title);

        writeMeta(user, request.time);
        paragraph(request.description);

        if (request.screenShotUrl) {
          const path = `/tmp/${discussion.id}-${request.id}.jpg`;
          doc.image(path, { width: 300 });
          doc.save();
          doc.moveDown();
        }

        renderComments(request.comments, 0);
      }
    };
    await writeRequests(discussion, users);
    // add stuff to PDF here using methods described below...

    // finalize the PDF and end the stream

    doc.addPage();
    doc.moveDown();
    header("Approvers");
    for (const userId of Object.keys(discussion.approverUserIds)) {
      const user = getUser(userId);

      doc.polygon([doc.x, doc.y], [doc.x + 100, doc.y]);
      doc.stroke();
      paragraph(`${user.firstName} ${user.lastName}`);
    }

    await doc.end();

    doc.on("end", () => {
      // let pdfData = Buffer.concat(buffers);
      // console.log('doc end')
      // ... now send pdfData as attachment ...
    });

    fs.rmdirSync(`./tmp/${discussion.id}`, { recursive: true });
  });
};
