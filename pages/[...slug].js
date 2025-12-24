import Head from "next/head";

export default function Page({ meta }) {
  return (
    <>
      <Head>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />

        {/* Open Graph */}
        <meta property="og:title" content={meta.title} />
        <meta property="og:description" content={meta.description} />
        <meta property="og:type" content="article" />
        <meta property="og:image" content={meta.image} />
        <meta property="og:url" content={meta.url} />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main style={{ padding: 40 }}>
        <h1>{meta.title}</h1>
        <p>{meta.description}</p>
      </main>
    </>
  );
}

export async function getServerSideProps({ params, req }) {
  const uri = "/" + params.slug.join("/") + "/";
  const ua = req.headers["user-agent"] || "";

  const isFacebook =
    ua.includes("facebookexternalhit") ||
    ua.includes("Facebot");

  let post = null;

  try {
    const res = await fetch(process.env.GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `
          query GetPost($uri: String!) {
            post(id: $uri, idType: URI) {
              title
              uri
              seo {
                title
                metaDesc
                opengraphImage {
                  sourceUrl
                }
              }
            }
          }
        `,
        variables: { uri }
      })
    });

    const json = await res.json();
    post = json?.data?.post || null;
  } catch (e) {}

  // 🔥 FACEBOOK → ALWAYS 200 (NO 404 EVER)
  if (isFacebook) {
    return {
      props: {
        meta: {
          title:
            post?.seo?.title ||
            post?.title ||
            "Latest News Update",
          description:
            post?.seo?.metaDesc ||
            "Read full details on our website.",
          image:
            post?.seo?.opengraphImage?.sourceUrl ||
            "https://via.placeholder.com/1200x630.png",
          url: uri
        }
      }
    };
  }

  // 👤 NORMAL USER → REDIRECT
  if (post?.uri) {
    return {
      redirect: {
        destination: post.uri,
        permanent: false
      }
    };
  }

  // 👤 FALLBACK REDIRECT (NO 404)
  return {
    redirect: {
      destination: "https://tech.symbolsemoji.com",
      permanent: false
    }
  };
}
