import { request } from './http';
import { ConfigDiagnostics, getMockConfigDiagnostics } from './adminConfigDiagnosticsMock';

export type { ConfigDiagnosticCheck, ConfigDiagnostics, DiagnosticStatus } from './adminConfigDiagnosticsMock';

export type AdminConfigDiagnosticsSession = {
  token: string;
};

const shouldUseMock = () => import.meta.env.VITE_CONFIG_DIAGNOSTICS_MOCK === 'true';

export const AdminConfigDiagnosticsService = {
  async getDiagnostics(session: AdminConfigDiagnosticsSession | null): Promise<ConfigDiagnostics> {
    if (shouldUseMock() || !session?.token) return getMockConfigDiagnostics();
    try {
      return await request<ConfigDiagnostics>('/admin/config/diagnostics', { token: session.token });
    } catch (err) {
      console.warn('Config diagnostics API failed, falling back to mock data.', err);
      return getMockConfigDiagnostics();
    }
  },
};
