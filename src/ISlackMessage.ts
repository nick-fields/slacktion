export interface SlackMessage {
  channel: string;
  text?: string;
  attachments?: {
    color: string;
    pretext: string;
    title: string;
    title_link: string;
    fields?: {
      short: boolean;
      title: string;
      value: string;
    }[];
    image_url: string;
    footer: string;
    footer_icon?: string;
    ts: number;
    actions?: {
      style: string;
      text: string;
      type: string;
      url: string;
    }[];
  }[];
  icon_url?: string;
  link_names: true;
}
