import { Helmet } from "react-helmet-async";

/**
 * Drop into any page that should not be crawled by search engines — the
 * authenticated account dashboard, live reveal sequences, personal chat,
 * and compatibility viewers. Search snippets of these pages would leak
 * personal copy and offer zero SEO value.
 */
export function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
  );
}
