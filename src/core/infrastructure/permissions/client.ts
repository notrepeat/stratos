import { env } from '@config';

export class SpiceDBClient {
  private useRealClient: boolean;
  private mockRelationships: Map<string, Set<string>> = new Map();
  private baseUrl: string;
  private token: string;

  constructor() {
    this.useRealClient =
      env.NODE_ENV === 'production' ||
      (env.SPICEDB_ENDPOINT !== undefined && env.SPICEDB_ENDPOINT !== '');

    this.baseUrl = env.SPICEDB_ENDPOINT || 'http://localhost:8443';
    this.token = env.SPICEDB_TOKEN || 'mypresharedkey';

    if (this.useRealClient) {
      console.log(
        '✅ SpiceDB client initialized with real connection to:',
        this.baseUrl,
      );
    } else {
      console.log('⚠️  Using mock SpiceDB client for development');
    }
  }

  // Check permissions
  async checkPermission(
    resource: string,
    permission: string,
    subject: string,
    consistency?: any,
  ): Promise<boolean> {
    if (!this.useRealClient) {
      return this.checkPermissionMock(resource, permission, subject);
    }

    try {
      // Real SpiceDB implementation using HTTP API
      const response = await fetch(`${this.baseUrl}/v1/permissions/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          resource: {
            objectType: resource.split(':')[0],
            objectId: resource.split(':')[1],
          },
          permission,
          subject: {
            object: {
              objectType: subject.split(':')[0],
              objectId: subject.split(':')[1],
            },
          },
          consistency,
        }),
      });

      if (!response.ok) {
        console.error('SpiceDB check permission failed:', response.statusText);
        return false;
      }

      const result = await response.json();
      return result.permissionship === 'PERMISSIONSHIP_HAS_PERMISSION';
    } catch (error) {
      console.error('SpiceDB permission check error:', error);
      return false;
    }
  }

  // Write relationships
  async writeRelationship(
    resource: string,
    relation: string,
    subject: string,
  ): Promise<void> {
    if (!this.useRealClient) {
      return this.writeRelationshipMock(resource, relation, subject);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/relationships/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          updates: [
            {
              operation: 'OPERATION_TOUCH',
              relationship: {
                resource: {
                  objectType: resource.split(':')[0],
                  objectId: resource.split(':')[1],
                },
                relation,
                subject: {
                  object: {
                    objectType: subject.split(':')[0],
                    objectId: subject.split(':')[1],
                  },
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `SpiceDB write relationship failed: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error('SpiceDB relationship write error:', error);
      throw error;
    }
  }

  // Delete relationships
  async deleteRelationship(
    resource: string,
    relation: string,
    subject: string,
  ): Promise<void> {
    if (!this.useRealClient) {
      return this.deleteRelationshipMock(resource, relation, subject);
    }

    try {
      const response = await fetch(`${this.baseUrl}/v1/relationships/write`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`,
        },
        body: JSON.stringify({
          updates: [
            {
              operation: 'OPERATION_DELETE',
              relationship: {
                resource: {
                  objectType: resource.split(':')[0],
                  objectId: resource.split(':')[1],
                },
                relation,
                subject: {
                  object: {
                    objectType: subject.split(':')[0],
                    objectId: subject.split(':')[1],
                  },
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `SpiceDB delete relationship failed: ${response.statusText}`,
        );
      }
    } catch (error) {
      console.error('SpiceDB relationship delete error:', error);
      throw error;
    }
  }

  // Mock implementations for development
  private checkPermissionMock(
    resource: string,
    permission: string,
    subject: string,
  ): boolean {
    const [resourceType, resourceId] = resource.split(':');
    const [, subjectId] = subject.split(':');

    // Super admin can do everything
    if (subjectId === 'super-admin') {
      return true;
    }

    // Simple mock logic
    switch (resourceType) {
      case 'tenant':
        if (permission === 'manage' || permission === 'admin') {
          return this.checkRelationshipMock(
            `tenant:${resourceId}`,
            'admin',
            `user:${subjectId}`,
          );
        }
        if (permission === 'read') {
          return (
            this.checkRelationshipMock(
              `tenant:${resourceId}`,
              'member',
              `user:${subjectId}`,
            ) ||
            this.checkRelationshipMock(
              `tenant:${resourceId}`,
              'admin',
              `user:${subjectId}`,
            )
          );
        }
        return false;

      default:
        return false;
    }
  }

  private writeRelationshipMock(
    resource: string,
    relation: string,
    subject: string,
  ): void {
    const key = `${resource}:${relation}`;
    if (!this.mockRelationships.has(key)) {
      this.mockRelationships.set(key, new Set());
    }
    this.mockRelationships.get(key)!.add(subject);
  }

  private deleteRelationshipMock(
    resource: string,
    relation: string,
    subject: string,
  ): void {
    const key = `${resource}:${relation}`;
    const subjects = this.mockRelationships.get(key);
    if (subjects) {
      subjects.delete(subject);
    }
  }

  private checkRelationshipMock(
    resource: string,
    relation: string,
    subject: string,
  ): boolean {
    const key = `${resource}:${relation}`;
    const subjects = this.mockRelationships.get(key);
    return subjects ? subjects.has(subject) : false;
  }
}

// Singleton instance
let spicedbClient: SpiceDBClient | null = null;

export function getSpiceDBClient(): SpiceDBClient {
  if (!spicedbClient) {
    spicedbClient = new SpiceDBClient();
  }
  return spicedbClient;
}
