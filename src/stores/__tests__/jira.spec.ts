import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useJiraStore } from '../jira';

const jiraServiceMock = vi.hoisted(() => ({
  initialize: vi.fn(),
  testConnection: vi.fn(),
  getIssuesInfo: vi.fn()
}));

vi.mock('@/services/jira.service', () => ({
  jiraService: jiraServiceMock
}));

describe('jira store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    jiraServiceMock.testConnection.mockResolvedValue(true);
  });

  it('clears cached issue urls after jira link config changes', async () => {
    const savedConfig = {
      host: 'jira.example.com',
      username: 'user',
      password: 'password',
      protocol: 'https',
      apiVersion: '2'
    };

    localStorage.setItem('jira-config', JSON.stringify(savedConfig));
    localStorage.setItem('jira-results-PROJ-1', JSON.stringify([
      {
        key: 'PROJ-1',
        title: '旧缓存',
        description: '描述',
        descriptionUrl: 'https://jira.example.com/browse/PROJ-1',
        assignee: '张三',
        commentAuthors: [],
        comments: {
          TEST: [],
          REVIEW: [],
          APPROVAL: [],
          VERIFICATION: []
        }
      }
    ]));
    localStorage.setItem('jira-order-PROJ-1', JSON.stringify(['PROJ-1']));

    const jiraStore = useJiraStore();
    jiraStore.loadConfig();

    const success = await jiraStore.saveConfig({
      ...savedConfig,
      protocol: 'http'
    });

    expect(success).toBe(true);
    expect(localStorage.getItem('jira-results-PROJ-1')).toBeNull();
    expect(localStorage.getItem('jira-order-PROJ-1')).toBeNull();
  });
});
