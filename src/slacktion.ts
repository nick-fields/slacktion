import { default as axios, AxiosRequestConfig, AxiosResponse } from "axios";
import { URLSearchParams } from "url";
import { ActionOptions } from "./IActionOptions";
import { SlackMessage } from "./ISlackMessage";

const POST_MESSAGE_PATH = "/api/chat.postMessage";
const JOIN_CONVERSATION_PATH = "/api/conversations.join";
const LIST_CHANNELS_PATH = "/api/conversations.list";

export function statusColor(status?: string): string | undefined {
  // slack interprets undefined to mean no color
  if (!status) {
    return undefined;
  }

  switch (status.toLowerCase()) {
    case "passed":
    case "success":
      return "#3bc3a3";
    case "warning":
    case "cancelled":
      return "#FFA500";
    case "neutral":
      return undefined;
    case "failed":
    case "failure":
    default:
      return "#FF0000";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getChannel(name: string, token: string): Promise<any> {
  let cursor = undefined;

  do {
    const query = new URLSearchParams({
      cursor,
      limit: "1000",
      exclude_archived: "true",
    }).toString();
    const path = `${LIST_CHANNELS_PATH}?${query}`;
    const resp = await request(
      token,
      path,
      undefined,
      "GET",
      "application/x-www-form-urlencoded"
    );
    cursor = resp.data.response_metadata.next_cursor;
    const channel = resp.data.channels.find((c: any) => c.name === name);

    if (channel) {
      return channel;
    }
    // this api is rate limited, so space out the attempts
    await sleep(5000);
  } while (cursor);
}

async function joinChannel(channel: string, token: string): Promise<void> {
  const conversation = await getChannel(channel, token);

  if (conversation) {
    await request(
      token,
      JOIN_CONVERSATION_PATH,
      { channel: conversation.id },
      "POST"
    );
    return;
  }
}

async function request(
  token: string,
  path: string,
  body: any,
  method: AxiosRequestConfig["method"],
  contentType = "application/json"
): Promise<AxiosResponse<any>> {
  const resp = await axios({
    method,
    baseURL: "https://slack.com",
    url: path,
    data: body,
    headers: {
      "Content-Type": contentType,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!resp.data.ok) {
    throw resp.data.error;
  }

  return resp;
}

export async function runAction(opts: ActionOptions) {
  const fields = opts.fields
    .trim()
    .split("\n")
    .filter((b) => `${b}`.trim().length > 0)
    .map((f) => {
      console.log(`field: ${f}`);
      return {
        short: true,
        title: f.split("|")[0]?.replace("~~", "|"),
        value: f.split("|")[1]?.replace("~~", "|"),
      };
    });
  const actions = opts.buttons
    .trim()
    .split("\n")
    .filter((b) => `${b}`.trim().length > 0)
    .map((b) => {
      console.log(`button: ${b}`);
      return {
        style: "default",
        type: "button",
        text: b.split("|")[0]?.replace("~~", "|"),
        url: b.split("|")[1]?.replace("~~", "|"),
      };
    });
  const body: SlackMessage = {
    channel: opts.channel,
    text: opts.text,
    link_names: true,
    icon_url: "https://github.com/bitrise-io.png",
    attachments: [
      {
        color: statusColor(opts.jobStatus),
        title: opts.title,
        title_link: opts.title_url,
        image_url: opts.image_url,
        footer: opts.footer,
        footer_icon: opts.footer_icon_url,
        pretext: opts.pretext,
        ts: new Date().getTime(),
        fields,
        actions,
      },
    ],
  };

  try {
    await request(opts.slackBotToken, POST_MESSAGE_PATH, body, "POST");
  } catch (error) {
    // attempt to join the channel once then re-request
    if (error.includes("not_in_channel")) {
      await joinChannel(body.channel, opts.slackBotToken);
      await request(opts.slackBotToken, POST_MESSAGE_PATH, body, "POST");
    } else {
      console.error(`Slack API returned the error: ${error}`);
      process.exit(1);
    }
  }
}
