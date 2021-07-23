import { GetStaticProps } from "next";
import { getSession, session, signIn, useSession } from "next-auth/client";
import Head from "next/head";
import Link from "next/link";
import router, { useRouter } from "next/router";
import { RichText } from "prismic-dom";
import { useEffect } from "react";
import { api } from "../../../services/api";
import { getPrismicClient } from "../../../services/prismic";
import { getStripeJs } from "../../../services/stripe-js";
import Styles from '../post.module.scss';
import styles from './styles.module.scss'

interface SubscribeButtonProps {
  priceId: string;
}

export function SubscribeButton({ priceId }: SubscribeButtonProps) {
  const [session] = useSession();
  const router = useRouter();
}

interface PostPreviewProps {
  post: {
    slug: string;
    title: string;
    content: string;
    updatedAt: string;
  }
}




export default function PostPreview({ post }: PostPreviewProps) {
  const [session] = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.activeSubscription) {
      router.push(`/posts/${post.slug}`)
    }
  }, [session])

  async function handleSubscribe() {
    if (!session) {
      signIn('github');
      return;
    }



    try {
      const response = await api.post('/subscribe')

      const { sessionId } = response.data;

      const stripe = await getStripeJs();

      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      alert(error.message);
    }
  }


  return (
    <>
      <Head>
        <title>{post.title} | Ignews</title>
      </Head>

      <main className={Styles.container}>
        <article className={Styles.post}>
          <h1>{post.title}</h1>
          <time>{post.updatedAt}</time>
          <div
            dangerouslySetInnerHTML={{ __html: post.content }}
            className={`${Styles.postContent} ${Styles.previewContent}`}
          />

          <div className={Styles.continueReading}>
            Wanna continue reading ?
            <button
              type="button"
              className={styles.subscribeButton}
              onClick={handleSubscribe}
            >
              Subscribe Now!
            </button>
          </div>

        </article>
      </main>
    </>
  )
}

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking'
  }
}

export const getStaticProps: GetStaticProps = async ({ params }) => {

  const { slug } = params;

  const prismic = getPrismicClient();

  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    slug,
    title: RichText.asText(response.data.title),
    content: RichText.asHtml(response.data.content.splice(0, 3)),
    updatedAt: new Date(response.last_publication_date).toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })
  }

  return {
    props: {
      post,
    },
    revalidate: 60 * 30, // 30 minutos
  }

}
