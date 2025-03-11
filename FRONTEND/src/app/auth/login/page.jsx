// import {MetaData} from 'react-router';
// import React from "react";
import LoginForm from '../../../components/auth/LoginForm';

const LoginPage = ()=>{
    return (
        <div className="min-h-screen flex items-center justify-center">
        <LoginForm />
    </div>
    )
}



// import { Helmet } from 'react-helmet';
import Head from "next/head"
import React from 'react';
import { Link } from 'react-router-dom';

const LoginPageMetadata = () => {
    return (
        <>
      <Head>
        <title>Login | Login System</title>
        <meta name="description" content="Login to your account" />
      </Head>
      <LoginPage />
    </>
    )
}

export default  { LoginPageMetadata , LoginPage } ;