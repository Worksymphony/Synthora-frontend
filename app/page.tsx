"use client";

import { motion, useScroll, useTransform } from "framer-motion";


export default function Home() {
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0.2]);

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <>
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-50 transition-colors duration-300"
      >
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-orange-600">WorkSymphony</h1>
          <nav className="space-x-6 hidden md:flex font-medium">
            <a href="#features" className="text-gray-600 hover:text-orange-500 transition-colors">Features</a>
            <a href="#how" className="text-gray-600 hover:text-orange-500 transition-colors">How It Works</a>
            <a href="#pricing" className="text-gray-600 hover:text-orange-500 transition-colors">Pricing</a>
            <a href="#faq" className="text-gray-600 hover:text-orange-500 transition-colors">FAQ</a>
            <a href="/login" className="text-blue-600 hover:text-blue-700 transition-colors">Login</a>
            <a href="/signup" className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">Sign Up</a>
          </nav>
        </div>
      </motion.header>

      {/* Hero */}
      <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/path/to/your-hero-image.jpg')",
            scale: scale,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
        </motion.div>

        <motion.div
          style={{ opacity: opacity }}
          className="relative z-10 container mx-auto px-6 text-white"
        >
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight"
          >
            Revolutionize Your Hiring <br /> with AI-Powered Harmony
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-4 text-lg md:text-xl max-w-2xl mx-auto"
          >
            From job posting to onboarding, WorkSymphony automates and streamlines HR so you can focus on people, not paperwork.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-8 flex justify-center space-x-4"
          >
            <a href="#pricing" className="bg-orange-500 text-white px-8 py-4 rounded-full shadow-lg hover:bg-orange-600 transition-colors font-semibold">
              Book a Demo
            </a>
          </motion.div>
        </motion.div>
      </section>
      
      {/* Rest of the sections (with scroll animations) */}
      <main className="bg-white z-20 relative">
        <section id="features" className="py-24 container mx-auto px-6">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={variants}
            className="text-4xl font-bold text-center mb-12"
          >
            Key Features 🚀
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { title: "Smart Candidate Screening", desc: "AI resume parsing and ranking to find the right talent faster." },
              { title: "Automated Interview Scheduling", desc: "Save hours by letting AI handle interview coordination." },
              { title: "Performance & Engagement Tracking", desc: "Monitor employee performance and engagement metrics in real time." }
            ].map((f, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                variants={variants}
                className="bg-gray-50 p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <h4 className="text-2xl font-bold mb-3 text-orange-600">{f.title}</h4>
                <p className="text-gray-600">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <hr className="my-12 border-gray-200" />

        <section id="how" className="bg-orange-50 py-24">
          <div className="container mx-auto px-6 text-center">
            <motion.h3
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              variants={variants}
              className="text-4xl font-bold mb-12"
            >
              How It Works
            </motion.h3>
            <div className="flex flex-col md:flex-row justify-center items-center md:space-x-12 space-y-6 md:space-y-0 font-medium text-orange-700">
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>Post Job</motion.div>
              <div className="text-gray-400 hidden md:block">→</div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.4 }}>AI Screening</motion.div>
              <div className="text-gray-400 hidden md:block">→</div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.6 }}>Interview Scheduling</motion.div>
              <div className="text-gray-400 hidden md:block">→</div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.8 }}>Onboarding</motion.div>
              <div className="text-gray-400 hidden md:block">→</div>
              <motion.div initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 1 }}>Performance Tracking</motion.div>
            </div>
          </div>
        </section>

        <hr className="my-12 border-gray-200" />

        <section className="py-24 container mx-auto px-6">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={variants}
            className="text-4xl font-bold text-center mb-12"
          >
            What Our Clients Say 🗣️
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { quote: "WorkSymphony made our hiring process seamless!", name: "Sarah L., HR Manager" },
              { quote: "We saved weeks of work thanks to AI automation.", name: "John D., Recruiter" },
              { quote: "The onboarding process is now a breeze.", name: "Priya K., Talent Lead" }
            ].map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                variants={variants}
                className="bg-white p-8 rounded-2xl shadow-lg"
              >
                <p className="italic text-lg text-gray-700">{`"${t.quote}"`}</p>
                <div className="mt-4 font-semibold text-orange-600">— {t.name}</div>
              </motion.div>
            ))}
          </div>
        </section>
        
        <hr className="my-12 border-gray-200" />

        {/* Pricing */}
        <section id="pricing" className="py-24 container mx-auto px-6">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={variants}
            className="text-4xl font-bold text-center mb-12"
          >
            Pricing Plans 💲
          </motion.h3>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Starter", price: "$29/month", features: ["1,000 resumes/mo", "Basic Screening", "Email Support"], btn: "Choose Plan" },
              { title: "Pro", price: "$79/month", features: ["Unlimited resumes", "Automated Scheduling", "Priority Support"], btn: "Choose Plan", highlight: true },
              { title: "Enterprise", price: "Custom", features: ["Everything in Pro", "Custom Integrations", "Dedicated Account Manager"], btn: "Contact Us" }
            ].map((p, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.2 }}
                variants={variants}
                className={`p-8 rounded-2xl shadow-xl text-center transition-all duration-300 transform hover:scale-105 ${p.highlight ? 'bg-orange-600 text-white' : 'bg-gray-50'}`}
              >
                <h4 className={`text-2xl font-bold mb-3 ${p.highlight ? 'text-white' : 'text-orange-700'}`}>{p.title}</h4>
                <p className={`text-4xl font-bold mb-4 ${p.highlight ? 'text-white' : 'text-gray-900'}`}>{p.price}</p>
                <ul className="mb-6 space-y-2 text-sm">
                  {p.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
                <button className={`px-6 py-3 rounded-full font-semibold transition-colors ${p.highlight ? 'bg-white text-orange-600 hover:bg-gray-200' : 'bg-orange-600 text-white hover:bg-orange-700'}`}>
                  {p.btn}
                </button>
              </motion.div>
            ))}
          </div>
        </section>
        
        <hr className="my-12 border-gray-200" />

        {/* FAQ */}
        <section id="faq" className="bg-orange-50 py-24">
          <div className="container mx-auto px-6">
            <motion.h3
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              variants={variants}
              className="text-4xl font-bold text-center mb-12"
            >
              Frequently Asked Questions
            </motion.h3>
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                { question: "How secure is WorkSymphony?", answer: "We use enterprise-grade encryption and follow strict security protocols to protect all data." },
                { question: "Can I integrate with my existing tools?", answer: "Yes, we support a wide range of integrations including Slack, Google Workspace, Microsoft Teams, and more." },
                { question: "Is there a free trial?", answer: "Yes, you can sign up for a 14-day free trial with no credit card required." }
              ].map((faq, i) => (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  variants={variants}
                  className="bg-white p-6 rounded-lg shadow-md"
                >
                  <h4 className="font-semibold text-lg text-orange-700">{faq.question}</h4>
                  <p className="mt-2 text-gray-600">{faq.answer}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 text-center">
          <motion.h3
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            variants={variants}
            className="text-4xl font-bold mb-4 leading-snug"
          >
            Ready to Transform Your HR Workflow?
          </motion.h3>
          <motion.a
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            href="signup.html" className="bg-orange-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-orange-700 transition-colors inline-block"
          >
            Start Free Trial
          </motion.a>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-8">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm">
          <div className="mb-4 md:mb-0 text-center md:text-left">
            <h4 className="font-bold mb-1 text-lg">WorkSymphony</h4>
            <p>© 2025 All rights reserved.</p>
          </div>
          <nav className="space-x-4">
            {["About", "Features", "Pricing", "Careers", "Blog", "Contact"].map((link, i) => (
              <a key={i} href="#" className="hover:underline transition-colors text-gray-300 hover:text-white">{link}</a>
            ))}
          </nav>
        </div>
      </footer>
    </>
  );
}