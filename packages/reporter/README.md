# @ironpermjs/reporter

Static offline HTML and JSON rendering from AnalysisResult. This package
contains no source analysis logic.

    import { renderHtmlReport, renderJsonReport } from "@ironpermjs/reporter";

    const html = renderHtmlReport(analysis, {
      title: "Authorization report",
      projectName: "Storefront",
    });
    const json = renderJsonReport(analysis);

The HTML dashboard contains overview, abilities, routes, Server Actions, HTTP
requests, issues, coverage, and graph data. It embeds its stylesheet and
requires no network or JavaScript.

CLI usage:
