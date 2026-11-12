/**
 * An expected problem in a pipeline step, with a message that is safe to show
 * to the person who submitted the item (for example "The site blocked us").
 */
export class StepError extends Error {
  constructor(public readonly userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.name = "StepError";
  }
}
