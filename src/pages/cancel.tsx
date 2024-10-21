import { NextPage } from 'next';
import Link from 'next/link';

const Cancel: NextPage = () => {
  return (
    <div>
      <h1>Your purchase was canceled.</h1>
      <Link href="/">Go back to the homepage</Link>
    </div>
  );
};

export default Cancel;
