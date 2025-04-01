"use client";
import React from "react";
import { Button } from "@components/ui/Button";
import { Card, CardContent } from "@components/ui/Card";
import { Checkbox } from "@components/ui/CheckBox";
import { Input } from "@components/ui/Input";

export default function LoginForm  ()  {
  // Decorative elements data for the left side
  const decorativeElements = [
    {
      id: 1,
      src: "/login/vector.svg",
      alt: "Vector",
      className: "absolute w-[47px] h-[55px] top-52 left-[531px]",
    },
    {
      id: 2,
      src: "/login/vector-1.svg",
      alt: "Vector",
      className: "absolute w-[27px] h-[31px] top-[537px] left-[646px]",
    },
    {
      id: 3,
      src: "/login/vector-4.svg",
      alt: "Vector",
      className: "absolute w-[121px] h-[140px] top-[884px] left-[776px]",
    },
    {
      id: 4,
      src: "/login//vector-17.svg",
      alt: "Vector",
      className: "absolute w-[18px] h-[21px] top-[755px] left-[148px]",
    },
    {
      id: 5,
      src: "/login/vector-39.svg",
      alt: "Vector",
      className: "absolute w-[35px] h-[29px] top-[530px] left-[172px]",
    },
    {
      id: 6,
      src: "/login/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[580px] left-[773px]",
    },
    {
      id: 7,
      src: "/login/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[450px] left-[161px]",
    },
    {
      id: 8,
      src: "/login/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[585px] left-[768px]",
    },
    {
      id: 9,
      src: "/login/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[568px] left-[735px]",
    },
    {
      id: 10,
      src: "/login/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[487px] left-[172px]",
    },
    {
      id: 11,
      src: "/login/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[236px] left-[751px]",
    },
    {
      id: 12,
      src: "/login/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[741px] left-[138px]",
    },
    {
      id: 13,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[337px] left-24",
    },
    {
      id: 14,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[922px] left-[694px]",
    },
    {
      id: 15,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[255px] left-[708px]",
    },
    {
      id: 16,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[760px] left-[95px]",
    },
    {
      id: 17,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[369px] left-[748px]",
    },
    {
      id: 18,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[873px] left-[135px]",
    },
    {
      id: 19,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[101px] left-[282px]",
    },
    {
      id: 20,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[807px] left-[767px]",
    },
    {
      id: 21,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[132px] left-[441px]",
    },
    {
      id: 22,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[138px] left-[514px]",
    },
    {
      id: 23,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[573px] left-[266px]",
    },
    {
      id: 24,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[606px] left-[253px]",
    },
    {
      id: 25,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[120px] left-[699px]",
    },
    {
      id: 26,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[108px] left-[751px]",
    },
    {
      id: 27,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[169px] left-[801px]",
    },
    {
      id: 28,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[131px] left-[638px]",
    },
    {
      id: 29,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-0.5 top-[46px] left-[623px]",
    },
  ];

  // Small decorative elements for the illustration area
  const smallDecorations = [
    {
      id: 1,
      src: "/group-3.png",
      alt: "Group",
      className: "absolute w-[35px] h-[29px] top-[207px] left-[257px]",
    },
    {
      id: 2,
      src: "/group-5.png",
      alt: "Group",
      className: "absolute w-[21px] h-[17px] top-[372px] left-[225px]",
    },
    {
      id: 3,
      src: "/vector-49.svg",
      alt: "Vector",
      className: "absolute w-[35px] h-[29px] top-0 left-[359px]",
    },
    {
      id: 4,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[293px] left-[312px]",
    },
    {
      id: 5,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[284px] left-[255px]",
    },
    {
      id: 6,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[271px] left-[278px]",
    },
    {
      id: 7,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[189px] left-[196px]",
    },
    {
      id: 8,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[225px] left-[237px]",
    },
    {
      id: 9,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-[283px] left-[38px]",
    },
    {
      id: 10,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-px h-0.5 top-44 left-[247px]",
    },
    {
      id: 11,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-0.5 top-[114px] left-[119px]",
    },
    {
      id: 12,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[326px] left-[299px]",
    },
    {
      id: 13,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[420px] left-[191px]",
    },
    {
      id: 14,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[238px] left-[199px]",
    },
    {
      id: 15,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[366px] left-[75px]",
    },
    {
      id: 16,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[294px] left-10",
    },
    {
      id: 17,
      src: "/vector-2.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[398px] left-[231px]",
    },
    {
      id: 18,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[237px] left-[298px]",
    },
    {
      id: 19,
      src: "/vector-18.svg",
      alt: "Vector",
      className: "absolute w-1.5 h-[7px] top-[322px] left-60",
    },
    {
      id: 20,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[200px] left-[135px]",
    },
    {
      id: 21,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-72 left-[34px]",
    },
    {
      id: 22,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[271px] left-0",
    },
    {
      id: 23,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[425px] left-[264px]",
    },
    {
      id: 24,
      src: "/vector-6.svg",
      alt: "Vector",
      className: "absolute w-0.5 h-[3px] top-[403px] left-[86px]",
    },
  ];

  return (
    <main className="flex h-screen w-full overflow-hidden">
      {/* Left side - Illustration */}
      <section className="relative w-[62.5%] h-full">
        <div className="absolute w-[803px] h-[903px] top-[50px] left-[50px] bg-[#ffe5c8] rounded-lg">
          {/* Main illustration */}
          <img
            className="absolute w-[430px] h-[499px] top-[150px] left-[240px]"
            alt="Skeleton illustration"
            src="/rectangle.png"
          />

          {/* Decorative elements */}
          {decorativeElements.map((element) => (
            <img
              key={element.id}
              className={element.className}
              alt={element.alt}
              src={element.src}
            />
          ))}

          {/* Illustration decoration area */}
          <div className="absolute w-[394px] h-[428px] top-24 left-[301px]">
            {smallDecorations.map((decoration) => (
              <img
                key={decoration.id}
                className={decoration.className}
                alt={decoration.alt}
                src={decoration.src}
              />
            ))}
          </div>

          {/* Additional illustration elements */}
          <img
            className="absolute w-[362px] h-[472px] top-[317px] left-[271px]"
            alt="Group"
            src="/group-4.png"
          />

          <div className="absolute w-[215px] h-[245px] top-0 left-0 bg-[url(/rectangle-1.png)] bg-[100%_100%]">
            <div className="relative w-[204px] h-40 top-[55px] left-[11px]">
              <img
                className="absolute w-[196px] h-[141px] top-[19px] left-0"
                alt="Vector"
                src="/vector-21.svg"
              />
              <img
                className="absolute w-[195px] h-[140px] top-0 left-[9px]"
                alt="Vector"
                src="/vector-24.svg"
              />
            </div>
          </div>

          <img
            className="absolute w-[142px] h-[89px] top-[401px] left-[573px]"
            alt="Group"
            src="/group-1.png"
          />

          <img
            className="absolute w-[131px] h-[82px] top-[385px] left-56"
            alt="Group"
            src="/group-2.png"
          />

          <img
            className="absolute w-[35px] h-[29px] top-[163px] left-[325px]"
            alt="Group"
            src="/group.png"
          />

          {/* Bottom text */}
          <div className="absolute w-[479px] text-center bottom-16 left-1/2 -translate-x-1/2 font-['Nunito_Sans',Helvetica] font-semibold text-[#72104b] text-[25px]">
            Start for free and get attractive offers from the community
          </div>
        </div>
      </section>

      {/* Right side - Login form */}
      <section className="relative w-[37.5%] h-full bg-white flex items-center justify-center">
        <Card className="w-[420px] border-none shadow-none">
          <CardContent className="p-0">
            <div className="flex flex-col gap-9">
              {/* Header */}
              <div className="flex flex-col gap-1">
                <h1 className="font-['Nunito_Sans',Helvetica] font-bold text-[#515151] text-4xl">
                  Login to your Account
                </h1>
                <p className="font-['Nunito_Sans',Helvetica] font-normal text-[#515151] text-base">
                  See what is going on with your business
                </p>
              </div>

              {/* Google login button */}
              <Button
                variant="outline"
                className="w-full h-12 border-[#e7e7e7] rounded-[5px] font-['Nunito_Sans',Helvetica] font-bold text-gray-3 text-sm"
              >
                <img
                  className="w-[25px] h-[25px] mr-2"
                  alt="Google logo"
                  src="/image-2.png"
                />
                Continue with Google
              </Button>

              {/* Divider */}
              <div className="flex items-center justify-center">
                <span className="text-[#dddddd]">-------------</span>
                <span className="text-[#a1a1a1] mx-2 font-['Nunito_Sans',Helvetica] font-semibold text-xs">
                  or Sign in with Email
                </span>
                <span className="text-[#dddddd]">-------------</span>
              </div>

              {/* Email input */}
              <div className="flex flex-col gap-1">
                <label className="font-['Nunito_Sans',Helvetica] font-semibold text-gray-3 text-sm">
                  Email
                </label>
                <Input
                  placeholder="mail@abc.com"
                  className="h-12 rounded-[5px] border-[#ded2d9] font-['Nunito_Sans',Helvetica] text-sm"
                />
              </div>
              {/* Password input */}
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-1">
                  <label className="font-['Nunito_Sans',Helvetica] font-semibold text-gray-3 text-sm">
                    Password
                  </label>
                  <Input
                    type="password"
                    defaultValue="password"
                    className="h-12 rounded-[5px] border-[#ded2d9] font-['Nunito_Sans',Helvetica] text-[10px]"
                  />
                </div>

                {/* Remember me and forgot password */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      className="w-3 h-3 rounded-sm bg-[#7f265b] border-[#7f265b]"
                      defaultChecked
                    />
                    <label
                      htmlFor="remember"
                      className="font-['Nunito_Sans',Helvetica] font-normal text-[#a1a1a1] text-xs"
                    >
                      Remember Me
                    </label>
                  </div>
                  <button className="font-['Nunito_Sans',Helvetica] font-semibold text-[#7f265b] text-xs">
                    Forgot Password?
                  </button>
                </div>
              </div>

              {/* Login button */}
              <Button className="w-full h-12 bg-[#7f265b] hover:bg-[#6a1f4d] rounded-md font-['Nunito_Sans',Helvetica] font-extrabold text-white text-lg">
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
};
