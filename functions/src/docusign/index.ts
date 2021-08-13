import {privateKey} from "../../config";
const docusign = require("docusign-esign");

export const basePath = "https://demo.docusign.net/restapi";

export const accountId = '8cf0e1da-cd1d-4d4e-a866-30170a471feb'

// export const accessToken = 'eyJ0eXAiOiJNVCIsImFsZyI6IlJTMjU2Iiwia2lkIjoiNjgxODVmZjEtNGU1MS00Y2U5LWFmMWMtNjg5ODEyMjAzMzE3In0.AQoAAAABAAUABwCAVhnDHlvZSAgAgL7dJCdb2UgCAFrRotqMYs1BvW70v3omKEcVAAEAAAAYAAIAAAAFAAAAHQAAAA0AJAAAAGE4YjhlNWI2LTc1MTYtNGIyMS05NzMyLTY0ZThjNTA0MmRiNyIAJAAAAGE4YjhlNWI2LTc1MTYtNGIyMS05NzMyLTY0ZThjNTA0MmRiNxIAAQAAAAYAAABqd3RfYnIjACQAAABhOGI4ZTViNi03NTE2LTRiMjEtOTczMi02NGU4YzUwNDJkYjc.LTqANLZd_81nrB5bVJ_x6rFQYnTrmpUuEEnshH_WLSSO1z7Zc6N8D0_ZvRsm4EOVXAK4uQ_M9lApsgPHtXaBxvB2cHe_FoYj1yLLYNOsdMTluyPrNOic8g6aAugZARNfDSfEjUV6SU5zj4l8u_Txa5mJEaCKHMga15rTJImo0FnCN_zaDwJHyxWcdgIyc4OCJUfF3hk-d-zQTkUiBk_Rg1BfioHWfx02Api3A0Nhfuy8hbEyXO07QQ-BT-Ja70YzE2VDCq04gP8S85NRTQSubRLFoboaOo1uTH7Fb_tQvsgtyuNzlh6-C2AObvITtH7CqxL-lKD681Y6xtQwniPUfQ'
const impersonatedId = "daa2d15a-628c-41cd-bd6e-f4bf7a262847"


export const generateAccessToken = async () => {
  let dsApi = new docusign.ApiClient({basePath: 'https://demo.docusign.net'});
  try {
    const results = await dsApi.requestJWTUserToken(
      'a8b8e5b6-7516-4b21-9732-64e8c5042db7',
      impersonatedId,
      ["signature", 'impersonation'],
      privateKey,
      60 * 60 * 24,
    );


    return results.body["access_token"]
  }
  catch (e) {
    console.log(e.response.text)
  }
};
