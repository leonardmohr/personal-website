// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  integrations: [
    starlight({
      title: 'leonardmohr.com',
      customCss: ['./src/styles/starlight-custom.css'],
      components: {
        Head: './src/components/overrides/Head.astro',
        Sidebar: './src/components/overrides/Sidebar.astro',
      },
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
        },
        {
          label: 'Other',
          autogenerate: { directory: 'learning/other' }
        },
        {
          label: 'Recipes',
          autogenerate: { directory: 'recipes' }
        }
      ]
    })
  ],
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex]
  }
});