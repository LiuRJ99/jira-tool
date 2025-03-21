/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'jira-client' {
  export default class JiraApi {
    constructor(options: {
      protocol?: string;
      host: string;
      port?: string | number;
      username: string;
      password: string;
      apiVersion?: string;
      strictSSL?: boolean;
      base?: string;
    });
    
    findIssue(issueKey: string, expand?: string): Promise<any>;
    getIssue(issueKey: string, expand?: string): Promise<any>;
    getComments(issueKey: string): Promise<any>;
    getCurrentUser(): Promise<any>;
  }
}
