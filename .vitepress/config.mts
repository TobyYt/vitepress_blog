import { defineConfig } from "vitepress";

export default defineConfig({
  lang: "zh-CN",
  title: "玄甲团队",
  themeConfig: {
    logo: "https://vitepress.dev/vitepress-logo-mini.svg",

    nav: [
      { text: "首页", link: "/" },
      { text: "文章列表", link: "/blog/async_await" },
      { text: "关于我们", link: "/about/about" },
    ],

    sidebar: {
      "/blog/": [
        {
          text: "文章列表",
          items: [
            {
              text: "JS中微任务与宏任务，Event Loop",
              link: "/blog/eventLoop",
            },
            { text: "async/await 原理", link: "/blog/async_await" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "gitee", link: "https://gitee.com/searchnull" }],

    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
    outlineTitle: "页面导航",

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    // 搜索
    search: {
      provider: "local",
    },

    //最后更新时间
    lastUpdated: {
      text: "最后更新",
      formatOptions: {
        dateStyle: "short",
        timeStyle: "short",
      },
    },

    footer: {
      message: "基于 MIT 许可发布",
      copyright: `版权所有 © 2025-${new Date().getFullYear()} Swordman`,
    },
  },
});
