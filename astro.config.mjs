// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Learning Notes',
      customCss: ['./src/styles/starlight-custom.css'],
      sidebar: [
        {
          label: 'Linear Algebra',
          autogenerate: { directory: 'learning/linear-algebra' }
        },
        {
          label: 'Probability',
          autogenerate: { directory: 'learning/probability' }
        },
        {
          label: 'Machine Learning',
          autogenerate: { directory: 'learning/machine-learning' }
        }
      ]
    })
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }
});