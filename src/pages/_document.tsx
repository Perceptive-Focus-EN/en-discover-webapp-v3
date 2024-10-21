import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import theme from '../styles/theme'; // Ensure theme is used elsewhere

class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Roboto Font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap"
          />
          {/* Inter Font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          />
          {/* Orbitron Font */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap"
          />
          {/* Additional Fonts */}
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/css2?family=Arial&family=Helvetica&family=Times+New+Roman&family=Courier+New&family=Verdana&display=swap"
          />
          {/* Mapbox CSS */}
          <link
            href='https://api.mapbox.com/mapbox-gl-js/v2.3.1/mapbox-gl.css'
            rel='stylesheet'
          />
          <style>
            {`
              body {
                font-family: 'Roboto', 'Inter', sans-serif;
                margin: 0;
              }
              .small-font {
                font-family: 'Inter', sans-serif;
              }
              .security-badge {
                font-family: 'Orbitron', sans-serif;
              }
            `}
          </style>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }

  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
}

export default MyDocument;