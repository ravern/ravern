export type ConfigPage = {
  path: string;
  templatePath?: string;
};

export type ConfigPageCollection = {
  name: string;
  path: string;
  singleTemplatePath: string;
  collectionTemplatePath?: string;
};

export type Config = {
  pages?: ConfigPage[];
  pageCollections?: ConfigPageCollection[];
};

export const CONFIG: Config = {
  pages: [
    {
      path: "index",
      templatePath: "article",
    },
  ],
  pageCollections: [
    {
      name: "Writing",
      path: "writing",
      singleTemplatePath: "article",
    },
  ],
};
