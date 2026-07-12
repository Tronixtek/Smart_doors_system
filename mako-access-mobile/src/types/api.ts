export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ORG_ADMIN' | 'ORG_USER';
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
}

export interface AccessPoint {
  _id: string;
  name: string;
  description?: string;
  type: 'DOOR' | 'GATE' | 'CABINET' | 'LIFT';
}

export interface Lock {
  _id: string;
  lockName: string;
  lockMac: string;
  batteryLevel: number;
  accessPointId?: AccessPoint;
}
