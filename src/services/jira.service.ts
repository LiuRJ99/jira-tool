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
  commentAuthors: Array<{
    name: string;
    color: string;
  }>;
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
    const colors = [
      '#E74C3C', // 鲜红色
      '#3498DB', // 明亮蓝色
      '#2ECC71', // 翠绿色
      '#9B59B6', // 紫色
      '#F1C40F', // 亮黄色
      '#1ABC9C', // 青绿色
      '#E67E22', // 橙色
      '#34495E', // 深蓝灰色
      '#27AE60', // 深绿色
      '#8E44AD', // 深紫色
      '#D35400', // 深橙色
      '#16A085', // 深青色
      '#C0392B', // 深红色
      '#2980B9', // 深蓝色
      '#F39C12', // 金色
      '#2C3E50'  // 靛蓝色
    ];

    // 创建全局的commentAuthors集合
    const globalCommentAuthors = new Map<string, { name: string; color: string }>();
    let colorIndex = 0;

    // 第一次遍历：收集所有工单的评论作者
    for (const key of issueKeys) {
      try {
        const comments = await this.getComments(key);
        for (const comment of comments.comments) {
          const authorName = comment.author.displayName;
          if (!globalCommentAuthors.has(authorName)) {
            globalCommentAuthors.set(authorName, {
              name: authorName,
              color: colors[colorIndex % colors.length]
            });
            colorIndex++;
          }
        }
      } catch (error) {
        console.error(`获取JIRA工单 ${key} 评论失败:`, error);
      }
    }

    // 第二次遍历：处理每个工单的详细信息
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
          // 获取评论创建时间
          const commentDate = new Date(comment.created);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // 格式化日期
          const formattedDate = `${commentDate.getFullYear()}-${String(commentDate.getMonth() + 1).padStart(2, '0')}-${String(commentDate.getDate()).padStart(2, '0')}`;
          
          // 如果超过7天，添加醒目标注
          const body = daysDiff > 7 
            ? `${comment.body}(${formattedDate}) ⚠️`
            : comment.body;
          
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
        
        // 添加到结果数组，使用全局收集的作者信息
        results.push({
          key,
          description: issue.fields.description || '',
          descriptionUrl,
          commentAuthors: Array.from(globalCommentAuthors.values()),
          comments: filteredComments
        });
      } catch (error) {
        console.error(`获取JIRA工单 ${key} 信息失败:`, error);
        // 对于失败的工单，添加错误信息
        results.push({
          key,
          description: '获取信息失败',
          descriptionUrl: '',
          commentAuthors: [],
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
