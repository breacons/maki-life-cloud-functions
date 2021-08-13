export interface User {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  organisation: string;
  email: string;
  avatar?: string;
  spaceIds: Record<string, boolean>;
  type: UserType;
}

export enum UserType {
  Expert = 'Expert',
  Editor = 'Editor',
}

// const user = {
//   id: 'm7WtW0JCmtVK75Z4b7doHnrfO002',
//   firstName: 'Marci',
//   lastName: 'Elodi',
//   role: 'Head of maps',
//   organisation: 'Center Maps of Maps',
//   email: 'elodimarci@gmail.com',
//   type: 'Editor',
//   spaceIds: ['hallo'],
//   avatar:
//     'https://images.generated.photos/mr9JTe3aTHlV_0JZ-XE7-qOXWPkFs5XdaUlIrLJ_yXc/rs:fit:512:512/wm:0.95:sowe:18:18:0.33/czM6Ly9pY29uczgu/Z3Bob3Rvcy1wcm9k/LnBob3Rvcy92M18w/MTIxODM5LmpwZw.jpg∏',
// };
//
// console.log(JSON.stringify(user))
