export interface ActionOptions {
  slackBotToken: string;
  channel: string;
  jobStatus: string;
  text: string;
  icon_url?: string;
  pretext: string;
  title: string;
  title_url?: string;
  image_url?: string;
  footer: string;
  footer_icon_url?: string;
  fields?: string;
  buttons?: string;
}
