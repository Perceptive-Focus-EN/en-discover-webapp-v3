import { NextPage } from 'next';
import Link from 'next/link';

const Success: NextPage = () => {
  return (
    <div>
      <h1>Thank you for your purchase!</h1>
      <Link href="/">Go back to the homepage</Link>
    </div>
  );
};

export default Success;
