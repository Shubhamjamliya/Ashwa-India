// A file the user picked, ready to upload. `blob` is only set in the browser preview build.
export type PickedFile = {
  uri: string;
  name: string;
  type: string;
  size: number | null;
  blob?: unknown;
};
