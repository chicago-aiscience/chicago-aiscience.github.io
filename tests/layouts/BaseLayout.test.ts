import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { expect, test } from "vitest";
import BaseLayout from "@/layouts/BaseLayout.astro";
// import { simpleTestSiteConfig } from "tests/fixtures/config";

// test("BaseLayout uses provided title and description", async () => {
//   const container = await AstroContainer.create();
//   const result = await container.renderToString(BaseLayout, {
//     props: {
//       title: simpleTestSiteConfig.title,
//       description: simpleTestSiteConfig.description,
//     },
//     slots: { default: "<div>Content</div>" },
//   });

//   expect(result).includes("<title>Test Site Title</title>");
//   expect(result).includes('content="Test site description"');
//   expect(result).includes('class="layout"');
//   //   expect(result).includes("<div>Content</div>");
// });

test("BaseLayout falls back to siteConfig defaults", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(BaseLayout, {
    slots: { default: "<div>Content</div>" },
  });

  //   expect(result).includes("<div>Content</div>");
  expect(result).includes("<title>AI in Science</title>");
  expect(result).includes('content="Postdocs research"');
});

test("BaseLayout renders slots", async () => {
  const container = await AstroContainer.create();
  const result = await container.renderToString(BaseLayout, {
    slots: { default: '<div class="test-content">div test content</div>' },
  });

  expect(result).includes("class=&quot;test-content&quot;");
  expect(result).includes("div test content");
});
