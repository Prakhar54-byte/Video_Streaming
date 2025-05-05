"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@components/ui/Button";
import { Card, CardContent } from "@components/ui/Card";
import { Checkbox } from "@components/ui/CheckBox";
import { Input } from "@components/ui/Input";
import axios from "axios";


export default function LoginForm() {
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
      src: "/login/vector-17.svg",
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

  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Replace with your actual login endpoint
      const res = await axios.post("http://localhost:8000/api/v1/users/login", 
        
         {
        headers: { "Content-Type": "application/json" },
      
    withCredentials: true ,// Include credentials for CORS
    body: JSON.stringify({email: formData.email, password: formData.password }),
      })

      if(res.ok){
        throw new Error("Login failed");
      }

      const data = await res.json();
      const token = data.token;

      localStorage.setItem("token", token); // Store the token in local storage
      // Redirect to the dashboard or home page
      window.location.href = "/dashboard"; // Change to your dashboard route

      
    } catch (err) {
      console.error("Login error:", err.response?.data || err.message);
      setError(
        err.response?.data?.message || "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  // Google login handler (placeholder)
  const handleGoogleLogin = () => {
    // Implement your OAuth flow here
    window.location.href = "/api/auth/google";
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-gradient-to-br from-[#ffe5c8] via-[#fff5ee] to-[#f8e1f4]">
      {/* Left side - Illustration */}
      <section className="relative w-[60%] h-full hidden md:block">
        <div className="absolute w-[90%] h-[95%] top-6 left-6 bg-[#ffe5c8] rounded-2xl shadow-xl overflow-hidden">
          <img className="absolute w-[430px] h-[499px] top-[150px] left-[240px]" alt="Illustration" src="/rectangle.png" />
          {decorativeElements.map((el) => (
            <img key={el.id} className={el.className} alt={el.alt} src={el.src} />
          ))}
          <div className="absolute w-[394px] h-[428px] top-24 left-[301px]">
            {smallDecorations.map((d) => (
              <img key={d.id} className={d.className} alt={d.alt} src={d.src} />
            ))}
          </div>
          {/* Add more illustration elements as desired */}
          <div className="absolute w-[479px] text-center bottom-16 left-1/2 -translate-x-1/2 font-['Nunito_Sans',Helvetica] font-semibold text-[#72104b] text-[25px]">
            Start for free and get attractive offers from the community
          </div>
        </div>
      </section>

      {/* Right side - Login form */}
      <section className="w-full md:w-[40%] h-full flex items-center justify-center bg-white relative z-10">
        <Card className="w-full max-w-[420px] border-none shadow-2xl rounded-xl">
          <CardContent className="p-8 flex flex-col gap-8">
            {/* Header */}
            <div className="flex flex-col gap-2">
              <h1 className="font-['Nunito_Sans',Helvetica] font-bold text-[#72104b] text-3xl md:text-4xl mb-1">Welcome Back!</h1>
              <p className="font-['Nunito_Sans',Helvetica] text-[#515151] text-base">Login to your account to continue</p>
            </div>

            {/* Google login button */}
            <Button
              variant="outline"
              className="w-full h-12 border-[#e7e7e7] rounded-[5px] font-['Nunito_Sans',Helvetica] font-bold text-gray-700 text-sm flex items-center justify-center gap-2 hover:bg-gray-100"
              onClick={handleGoogleLogin}
              type="button"
            >
              <img className="w-[25px] h-[25px]" alt="Google logo" src="/image-2.png" />
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-2">
              <span className="flex-grow h-px bg-[#dddddd]" />
              <span className="text-[#a1a1a1] font-['Nunito_Sans',Helvetica] font-semibold text-xs">or sign in with email</span>
              <span className="flex-grow h-px bg-[#dddddd]" />
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="email" className="font-['Nunito_Sans',Helvetica] font-semibold text-gray-700 text-sm">Email</label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="mail@abc.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-[5px] border-[#ded2d9] font-['Nunito_Sans',Helvetica] text-sm"
                  autoComplete="email"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="password" className="font-['Nunito_Sans',Helvetica] font-semibold text-gray-700 text-sm">Password</label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="h-12 rounded-[5px] border-[#ded2d9] font-['Nunito_Sans',Helvetica] text-sm"
                  autoComplete="current-password"
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                <div className="flex items-center gap-2">
                  <Checkbox id="remember" className="w-4 h-4 rounded-sm bg-[#7f265b] border-[#7f265b]" defaultChecked />
                  <label htmlFor="remember" className="font-['Nunito_Sans',Helvetica] text-[#a1a1a1] text-xs">Remember Me</label>
                </div>
                <button type="button" className="font-['Nunito_Sans',Helvetica] font-semibold text-[#7f265b] text-xs hover:underline">
                  Forgot Password?
                </button>
              </div>
              {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#7f265b] hover:bg-[#6a1f4d] rounded-md font-['Nunito_Sans',Helvetica] font-extrabold text-white text-lg mt-2"
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>

            {/* Sign up link */}
            <div className="text-center text-sm text-[#515151] mt-2">
              Don&apos;t have an account?{" "}
              <a href="/register" className="text-[#7f265b] font-semibold hover:underline">Sign up</a>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
