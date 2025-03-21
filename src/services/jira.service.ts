// 移除jira-client导入，使用axios
// import JiraApi from 'jira-client';
import axios from 'axios';
import type { AxiosInstance } from 'axios';

// JIRA配置接口
export interface JiraConfig {
  host: string;
  username: string;
  password: string;
  protocol?: string;
  apiVersion?: string;
}

// 备注类型枚举
export enum CommentType {
  TEST = '测试',
  REVIEW = '复核',
  APPROVAL = '同意',
  VERIFICATION = '验证'
}

// JIRA工单信息接口
export interface JiraIssueInfo {
  key: string;
  description: string;
  descriptionUrl: string;
  comments: {
    [CommentType.TEST]: string[];
    [CommentType.REVIEW]: string[];
    [CommentType.APPROVAL]: string[];
    [CommentType.VERIFICATION]: string[];
  };
}

// JIRA服务类
export class JiraService {
  private config: JiraConfig | null = null;
  private jiraClient: AxiosInstance | null = null;
  private originalHost: string = '';

  /**
   * 初始化JIRA客户端
   * @param config JIRA配置信息
   */
  initialize(config: JiraConfig): void {
    this.config = config;
    // 保存原始主机地址，用于构建JIRA页面URL
    this.originalHost = config.host;
    
    // 使用代理URL而不是直接访问JIRA服务器
    this.jiraClient = axios.create({
      // 使用Vite代理前缀，不直接访问JIRA服务器
      baseURL: '/jira-api',
      headers: { 
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      // 保留基本身份验证
      auth: {
        username: config.username,
        password: config.password
      }
    });
  }

  /**
   * 发送JIRA API请求
   * @param endpoint API端点
   * @returns 响应数据
   */
  private async apiRequest(endpoint: string): Promise<any> {
    if (!this.jiraClient) {
      throw new Error('JIRA客户端未初始化，请先配置JIRA信息');
    }

    const apiVersion = this.config?.apiVersion || '2';
    // 构建API路径
    const apiPath = `/rest/api/${apiVersion}${endpoint}`;

    try {
      console.log(`发送请求到代理: ${apiPath}`);
      const response = await this.jiraClient.get(apiPath);
      return response.data;
    } catch (error: any) {
      console.error('JIRA API请求错误:', error);
      
      // 提取详细错误信息
      if (error.response) {
        // 服务器响应了错误状态码
        throw new Error(`JIRA API请求失败: ${error.response.status} ${error.response.statusText} - ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        // 请求已发送但没有收到响应
        throw new Error(`JIRA服务器无响应: ${error.message}`);
      } else {
        // 请求配置出错
        throw new Error(`JIRA请求配置错误: ${error.message}`);
      }
    }
  }

  /**
   * 获取工单信息
   * @param issueKey 工单号
   * @returns 工单信息
   */
  private async findIssue(issueKey: string): Promise<any> {
    return this.apiRequest(`/issue/${issueKey}`);
  }

  /**
   * 获取工单备注
   * @param issueKey 工单号
   * @returns 备注信息
   */
  private async getComments(issueKey: string): Promise<any> {
    return this.apiRequest(`/issue/${issueKey}/comment`);
  }

  /**
   * 获取当前用户信息
   * @returns 用户信息
   */
  private async getCurrentUser(): Promise<any> {
    return this.apiRequest('/myself');
  }

  /**
   * 获取JIRA工单信息
   * @param issueKeys 工单号数组
   * @returns 工单信息数组Promise
   */
  async getIssuesInfo(issueKeys: string[]): Promise<JiraIssueInfo[]> {
    if (!this.config) {
      throw new Error('JIRA客户端未初始化，请先配置JIRA信息');
    }

    const results: JiraIssueInfo[] = [];

    for (const key of issueKeys) {
      try {
        // 获取工单详情
        const issue = await this.findIssue(key);
        
        // 获取工单备注
        const comments = await this.getComments(key);
        
        // 初始化备注对象
        const filteredComments = {
          [CommentType.TEST]: [] as string[],
          [CommentType.REVIEW]: [] as string[],
          [CommentType.APPROVAL]: [] as string[],
          [CommentType.VERIFICATION]: [] as string[]
        };
        
        // 提取包含关键字的备注
        for (const comment of comments.comments) {
          const body = comment.body;
          
          if (body.includes(CommentType.TEST)) {
            filteredComments[CommentType.TEST].push(body);
          }
          
          if (body.includes(CommentType.REVIEW)) {
            filteredComments[CommentType.REVIEW].push(body);
          }
          
          if (body.includes(CommentType.APPROVAL)) {
            filteredComments[CommentType.APPROVAL].push(body);
          }
          
          if (body.includes(CommentType.VERIFICATION)) {
            filteredComments[CommentType.VERIFICATION].push(body);
          }
        }
        
        // 构建JIRA页面URL (使用原始主机地址)
        const protocol = this.config.protocol || 'http';
        const descriptionUrl = `${protocol}://${this.originalHost}/browse/${key}`;
        
        // 添加到结果数组
        results.push({
          key,
          description: issue.fields.description || '',
          descriptionUrl,
          comments: filteredComments
        });
      } catch (error) {
        console.error(`获取JIRA工单 ${key} 信息失败:`, error);
        // 对于失败的工单，添加错误信息
        results.push({
          key,
          description: '获取信息失败',
          descriptionUrl: '',
          comments: {
            [CommentType.TEST]: [],
            [CommentType.REVIEW]: [],
            [CommentType.APPROVAL]: [],
            [CommentType.VERIFICATION]: []
          }
        });
      }
    }

    return results;
  }

  /**
   * 检查JIRA连接
   * @returns 连接状态Promise
   */
  async testConnection(): Promise<boolean> {
    try {
      // 尝试获取当前用户信息来测试连接
      await this.getCurrentUser();
      return true;
    } catch (error) {
      console.error('JIRA连接测试失败:', error);
      return false;
    }
  }
}

// 导出单例
export const jiraService = new JiraService(); 