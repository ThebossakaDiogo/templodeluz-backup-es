import { supabase } from "@/lib/supabase";
import { sendEvolutionLocalMedia, sendEvolutionLocalText } from "@/services/evolution-local-bridge";
import {
  invokeTikTokDashboardFunction,
  type DashboardProfileId,
} from "@/lib/dashboard-profiles";
import type {
  WhatsAppAiRun,
  WhatsAppAiSettings,
  WhatsAppChatMessage,
  WhatsAppChatThread,
  WhatsAppMaterial,
  WhatsAppMessageType,
  WhatsAppThreadStatus,
} from "@/types";

const ADMIN_FUNCTION = "whatsapp-chat-admin";

interface AdminResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

interface AdminThreadRow {
  id: string;
  customer_name: string | null;
  customer_phone: string;
  status: "open" | "resolved" | "opted_out";
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  created_at: string;
}

interface AdminMessageRow {
  id: string;
  thread_id: string;
  direction: "inbound" | "outbound";
  author_type: "customer" | "admin" | "ai" | "system";
  message_type: WhatsAppMessageType | "video";
  body: string;
  media_url: string | null;
  delivery_status: WhatsAppChatMessage["delivery_status"];
  created_at: string;
}

interface AdminSettingsRow {
  ai_enabled: boolean;
  automation_enabled: boolean;
  ai_system_prompt: string;
  updated_at: string | null;
}

export interface WhatsAppChatClient {
  listThreads(input?: { query?: string; status?: WhatsAppThreadStatus; cursor?: string }): Promise<{
    threads: WhatsAppChatThread[];
    next_cursor: string | null;
  }>;
  listMessages(threadId: string): Promise<WhatsAppChatMessage[]>;
  updateThread(threadId: string, status: WhatsAppThreadStatus): Promise<void>;
  listMaterials(query?: string): Promise<WhatsAppMaterial[]>;
  uploadMaterial(input: { file: File; category: string; description: string }): Promise<WhatsAppMaterial>;
  getAiSettings(): Promise<WhatsAppAiSettings>;
  updateAiSettings(settings: Partial<WhatsAppAiSettings>): Promise<WhatsAppAiSettings>;
  generateDraft(threadId: string): Promise<{ draft: string; run: WhatsAppAiRun | null }>;
  listAiRuns(threadId: string): Promise<WhatsAppAiRun[]>;
  sendText(input: { thread: WhatsAppChatThread; content: string }): Promise<void>;
  sendMaterial(input: { thread: WhatsAppChatThread; material: WhatsAppMaterial }): Promise<void>;
}

function mapThread(row: AdminThreadRow): WhatsAppChatThread {
  return {
    id: row.id,
    customer_name: row.customer_name,
    customer_email: null,
    customer_phone: row.customer_phone,
    ente_querido: null,
    payment_status: null,
    status: row.status,
    last_message_content: row.last_message_preview,
    last_message_direction: null,
    last_message_at: row.last_message_at ?? row.created_at,
    unread_count: row.unread_count,
    created_at: row.created_at,
  };
}

function mapMessage(row: AdminMessageRow): WhatsAppChatMessage {
  return {
    id: row.id,
    thread_id: row.thread_id,
    direction: row.author_type === "ai" ? "ai" : row.direction,
    message_type: row.message_type === "video" ? "document" : row.message_type,
    content: row.body || null,
    media_url: row.media_url,
    media_name: null,
    delivery_status: row.delivery_status,
    failure_reason: null,
    created_at: row.created_at,
  };
}

function mapSettings(row: AdminSettingsRow): WhatsAppAiSettings {
  return {
    enabled: row.automation_enabled,
    ai_enabled: row.ai_enabled,
    brand_instructions: row.ai_system_prompt,
    tone: "acolhedor e objetivo",
    away_message: null,
    response_window_minutes: 15,
    message_limit: 3,
    updated_at: row.updated_at,
  };
}

export function createWhatsAppChatClient(
  profile: DashboardProfileId,
  metaAccessToken: string | undefined
): WhatsAppChatClient {
  const profileOrigin = profile === "meta" ? "original" : "mirrored";
  const invoke = async <T>(action: string, input: Record<string, unknown> = {}): Promise<T> => {
    const body = { action, profileOrigin, ...input };
    if (profile === "tiktok") {
      const payload = await invokeTikTokDashboardFunction<AdminResponse<T>>(
        ADMIN_FUNCTION,
        metaAccessToken,
        body
      );
      return (payload.data ?? payload) as T;
    }

    const { data, error } = await supabase.functions.invoke<AdminResponse<T>>(ADMIN_FUNCTION, {
      body,
      headers: metaAccessToken ? { "x-meta-authorization": `Bearer ${metaAccessToken}` } : undefined,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return (data?.data ?? data) as T;
  };

  return {
    async listThreads() {
      const result = await invoke<{ threads: AdminThreadRow[] }>("list_threads", { limit: 60 });
      return { threads: (result.threads ?? []).map(mapThread), next_cursor: null };
    },
    async listMessages(threadId) {
      const result = await invoke<{ messages: AdminMessageRow[] }>("get_thread", { threadId });
      return (result.messages ?? []).map(mapMessage);
    },
    async updateThread(threadId, status) {
      await invoke<void>("update_thread", {
        threadId,
        status,
      });
    },
    async listMaterials(query) {
      const result = await invoke<{ materials: WhatsAppMaterial[] }>("list_materials", { query });
      return result.materials ?? [];
    },
    async uploadMaterial({ file, category, description }) {
      if (file.size > 7_000_000) throw new Error("O material deve ter no máximo 7 MB.");
      const contentBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Não foi possível ler o material."));
        reader.onload = () => resolve(String(reader.result ?? "").split(",")[1] ?? "");
        reader.readAsDataURL(file);
      });
      return invoke<WhatsAppMaterial>("upload_material", { name: file.name, mime_type: file.type, content_base64: contentBase64, category, description });
    },
    async getAiSettings() {
      return mapSettings(await invoke<AdminSettingsRow>("get_settings"));
    },
    async updateAiSettings(settings) {
      return mapSettings(await invoke<AdminSettingsRow>("update_settings", {
        aiEnabled: settings.ai_enabled,
        automationEnabled: settings.enabled,
        aiSystemPrompt: settings.brand_instructions,
      }));
    },
    async generateDraft(threadId) {
      const result = await invoke<{ draft: string; run: WhatsAppAiRun | null }>("generate_draft", { threadId });
      return { draft: result.draft, run: result.run };
    },
    async listAiRuns(threadId) {
      const result = await invoke<{ runs: WhatsAppAiRun[] }>("list_ai_runs", { threadId });
      return result.runs ?? [];
    },
    async sendText({ thread, content }) {
      const result = await sendEvolutionLocalText(profile, thread.customer_phone, content);
      await invoke("record_outgoing", { threadId: thread.id, content, message_type: "text", remote_message_id: result.remote_message_id });
    },
    async sendMaterial({ thread, material }) {
      const prepared = await invoke<{ signed_url: string; caption: string }>("prepare_material", { material_id: material.id });
      const result = await sendEvolutionLocalMedia(profile, thread.customer_phone, prepared.signed_url, prepared.caption, material.mime_type);
      await invoke("record_outgoing", { threadId: thread.id, content: prepared.caption, message_type: material.mime_type.startsWith("image/") ? "image" : "document", media_url: prepared.signed_url, material_id: material.id, remote_message_id: result.remote_message_id });
    },
  };
}
