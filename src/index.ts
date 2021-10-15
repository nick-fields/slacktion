import { runAction } from "./slacktion";
import { setFailed, info, getInput } from "@actions/core";
import { ActionOptions } from "./IActionOptions";

const opts: ActionOptions = {
  slackBotToken: getInput("slack_bot_token"),
  jobStatus: getInput("job_status"), // success, failure, or cancelled

  channel: getInput("channel"),
  text: getInput("text"),
  icon_url: getInput("icon_url"),
  pretext: getInput("pretext"),
  title: getInput("title"),
  title_url: getInput("title_url"),
  image_url: getInput("image_url"),
  footer: getInput("footer"),
  footer_icon_url: getInput("footer_icon_url"),
  fields: getInput("fields"),
  buttons: getInput("buttons"),
};

runAction(opts)
  .then(() => {
    info("Action completed successfully");
  })
  .catch((e) => {
    setFailed(e.toString());
  });
