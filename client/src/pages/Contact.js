import React, { useState, useContext } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useInView } from 'react-intersection-observer';
import {
    PhoneIcon,
    EnvelopeIcon,
    MapPinIcon,
    QuestionMarkCircleIcon,
    CheckCircleIcon,
    ChevronDownIcon,
    BuildingOffice2Icon,
    ChatBubbleLeftRightIcon,
    TicketIcon
} from '@heroicons/react/24/outline';

import contactService from '../services/contactService';
import { SettingsContext } from '../context/SettingsContext';
import { ThemeContext } from '../context/ThemeContext';
// The LoadingSpinner import is no longer needed in this specific file
// import LoadingSpinner from '../components/common/LoadingSpinner'; 

const AnimateInView = ({ children, threshold = 0.1, triggerOnce = true, className = '' }) => {
    const { ref, inView } = useInView({ threshold, triggerOnce });
    return (
        <div ref={ref} className={`${className} transition-all duration-700 ease-out ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            {children}
        </div>
    );
};

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    const { theme } = useContext(ThemeContext) || { theme: 'light' };
    return (
        <div className={`border-b py-6 ${theme === 'dark' ? 'border-gray-800' : 'border-gray-200'}`}>
            <button
                className="flex justify-between items-center w-full text-left focus:outline-none group"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
            >
                <span className={`text-lg font-semibold group-hover:text-red-500 transition-colors duration-200 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{question}</span>
                <ChevronDownIcon className={`w-6 h-6 text-red-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className={`pt-4 pr-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{answer}</p>
                </div>
            </div>
        </div>
    );
};

const OfficeMap = ({ latitude, longitude, zoom, title }) => {
    const { theme } = useContext(ThemeContext) || { theme: 'light' };
    const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed&t=&z=15&ie=UTF8&iwloc=B&output=embed`;

    return (
        <AnimateInView>
            <div className={`rounded-2xl overflow-hidden shadow-2xl border backdrop-blur-sm ${theme === 'dark' ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white/50'}`}>
                <h3 className={`text-2xl font-bold px-6 py-5 flex items-center ${theme === 'dark' ? 'text-white bg-black/30' : 'text-gray-900 bg-gray-200/20'}`}>
                    <MapPinIcon className="h-7 w-7 mr-3 text-red-500" /> {title}
                </h3>
                <div className="p-2">
                    <iframe
                        src={googleMapsEmbedUrl}
                        width="100%"
                        height="450"
                        style={{ border: 0, borderRadius: '12px' }}
                        allowFullScreen=""
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Office Location Map"
                        className="w-full h-full"
                    ></iframe>
                </div>
            </div>
        </AnimateInView>
    );
};

const TicketStatusCard = ({ ticket, theme }) => {
    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'Under Review': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
            case 'Completed': return 'bg-green-500/10 text-green-500 border-green-500/20';
            default: return 'bg-gray-200 text-gray-800 border-gray-300';
        }
    };
    return (
        <div className={`p-6 rounded-lg shadow-md mt-6 border text-left ${theme === 'dark' ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-white/60'}`}>
            <div className="flex justify-between items-center mb-4">
                <h4 className={`font-bold text-xl ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Ticket #{ticket.ticketNumber}</h4>
                <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(ticket.status)}`}>
                    {ticket.status}
                </span>
            </div>
            <div className={`mt-4 p-4 rounded-md border ${theme === 'dark' ? 'bg-black/20 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>Your Original Message:</p>
                <p className={`mt-1 italic ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>"{ticket.message}"</p>
            </div>
            {ticket.adminResponse && (
                <div className={`mt-4 p-4 rounded-md border ${theme === 'dark' ? 'bg-green-900/20 border-green-500/30' : 'bg-green-50 border-green-200'}`}>
                    <p className={`font-semibold ${theme === 'dark' ? 'text-green-300' : 'text-green-800'}`}>Admin's Reply:</p>
                    <p className={`mt-1 whitespace-pre-wrap ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{ticket.adminResponse}</p>
                </div>
            )}
            <p className={`text-right text-xs mt-4 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                Submitted: {new Date(ticket.createdAt).toLocaleString()}
            </p>
        </div>
    );
};

function Contact() {
    const { theme } = useContext(ThemeContext) || { theme: 'light' };
    const context = useContext(SettingsContext);
    const settings = context?.settings || {};
    const loadingSettings = context?.loadingSettings || false;

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [formLoading, setFormLoading] = useState(false);

    const [ticketNumberInput, setTicketNumberInput] = useState('');
    const [ticketData, setTicketData] = useState(null);
    const [ticketLoading, setTicketLoading] = useState(false);
    const [ticketError, setTicketError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormLoading(true);
        if (!name || !email || !message) {
            toast.error("Please fill in all fields.");
            setFormLoading(false);
            return;
        }
        try {
            const response = await contactService.submitMessage(name, email, message);
            toast.success(
                <div>
                    <p>{response.message}</p>
                    <p className="mt-2">Your Ticket #: <strong className="text-lg font-mono">{response.ticketNumber}</strong></p>
                    <p className="text-xs mt-1">Please save this number to check your ticket status.</p>
                </div>,
                { icon: <CheckCircleIcon className="h-8 w-8 text-green-500" />, autoClose: 20000 }
            );
            setName(''); setEmail(''); setMessage('');
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send message.");
        } finally {
            setFormLoading(false);
        }
    };

    const handleTicketCheck = async (e) => {
        e.preventDefault();
        if (!ticketNumberInput.trim()) {
            setTicketError("Please enter a ticket number.");
            return;
        }
        setTicketLoading(true);
        setTicketData(null);
        setTicketError('');
        try {
            const response = await contactService.checkTicketStatus(ticketNumberInput.trim());
            setTicketData(response.ticket);
        } catch (error) {
            setTicketError(error.response?.data?.message || "Could not fetch ticket status.");
            setTicketData(null);
        } finally {
            setTicketLoading(false);
        }
    };

    const faqs = [
        { question: "How do I reset my password?", answer: "You can reset your password on the login page by clicking 'Forgot Password'. Follow the instructions sent to your email." },
        { question: "What are your business hours?", answer: "Our support team is available Monday to Friday, from 9:00 AM to 5:00 PM IST. We are closed on weekends and public holidays." },
        { question: "How long does it take to get a response?", answer: "We aim to respond to all inquiries within 24-48 business hours. Complex issues may require more time, but we will keep you updated." },
        { question: "What information should I include in a support ticket?", answer: "To help us resolve your issue quickly, please include your account ID, a detailed description of the problem, and any error messages or screenshots." },
    ];
    
    const contactCards = [
        { icon: <ChatBubbleLeftRightIcon className={`h-7 w-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}/>, title: "Chat to support", description: "We're here to help.", link: `mailto:${settings.contactEmail}`, linkText: settings.contactEmail },
        { icon: <PhoneIcon className={`h-7 w-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}/>, title: "Call us", description: "Mon-Fri from 9am to 5pm.", link: `tel:${settings.officePhone}`, linkText: settings.officePhone },
        { icon: <BuildingOffice2Icon className={`h-7 w-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}/>, title: "Visit us", description: "Visit our office HQ.", link: "#contact-map", linkText: "View on Google Maps" },
        { icon: <QuestionMarkCircleIcon className={`h-7 w-7 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}/>, title: "Help Center", description: "Find quick answers.", link: "#faq-section", linkText: "Visit Help Center" }
    ];

    if (loadingSettings) {
        return (
            <div className={`flex items-center justify-center min-h-screen ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
                <p className="text-red-500 text-xl animate-pulse">Loading Contact Experience...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen font-sans overflow-x-hidden ${theme === 'dark' ? 'bg-black text-gray-300' : 'bg-white text-gray-800'}`}>
            <ToastContainer position="bottom-right" theme={theme === 'dark' ? 'dark' : 'light'} autoClose={5000} hideProgressBar={false} />
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                 <div className={`absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full filter blur-3xl opacity-50 ${theme === 'dark' ? 'bg-red-900/40' : 'bg-red-500/10'}`}></div>
                 <div className={`absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full filter blur-3xl opacity-50 ${theme === 'dark' ? 'bg-red-900/40' : 'bg-red-500/10'}`}></div>
            </div>

            <main className="relative z-10">
                <section className="py-24 sm:py-32 lg:py-40 text-center container mx-auto px-4">
                    <AnimateInView>
                        <h1 className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold mb-4 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            How can we <span className="text-red-500">help</span>?
                        </h1>
                        <p className={`text-lg md:text-xl mb-8 max-w-3xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Your one-stop destination for all support, inquiries, and resources. We're here to ensure your experience is seamless.
                        </p>
                    </AnimateInView>
                </section>
                
                <section className="pb-20 lg:pb-28 pt-6">
                    <div className="container mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Get in Touch Directly
                            </h2>
                            <p className={`mt-3 text-lg max-w-2xl mx-auto ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Choose your preferred method to connect with us for immediate assistance.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            {contactCards.map((card, index) => (
                                <AnimateInView key={index}>
                                    <div className={`backdrop-blur-sm border rounded-2xl p-8 text-center h-full flex flex-col hover:border-red-500/50 transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1A1A1A] border-gray-800' : 'bg-white/50 border-gray-200'}`}>
                                        <div className="flex justify-center mb-5">{card.icon}</div>
                                        <h3 className={`text-xl font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{card.title}</h3>
                                        <p className={`mb-4 flex-grow ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{card.description}</p>
                                        <a href={card.link} className="font-semibold text-red-500 hover:text-red-400 transition-colors mt-auto">
                                            {card.linkText}
                                        </a>
                                    </div>
                                </AnimateInView>
                            ))}
                        </div>
                    </div>
                </section>
                
                <section id="contact-form" className={`py-20 lg:py-28 rounded-2xl ${theme === 'dark' ? 'bg-[#1A1A1A]' : 'bg-gray-100/50'}`}>
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
                            <AnimateInView>
                                <div>
                                    <h2 className={`text-4xl md:text-5xl font-bold mb-4 leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Let's build the <span className="text-red-500">future</span> together.
                                    </h2>
                                    <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Have a specific question or need assistance? Fill out the form, and our team will get back to you promptly.
                                    </p>
                                    <div className="space-y-6 mt-12">
                                        <div className="flex items-center">
                                            <EnvelopeIcon className="h-6 w-6 text-red-500 mr-4 flex-shrink-0" />
                                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{settings.contactEmail}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <PhoneIcon className="h-6 w-6 text-red-500 mr-4 flex-shrink-0" />
                                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{settings.officePhone}</p>
                                        </div>
                                        <div className="flex items-start">
                                            <MapPinIcon className="h-6 w-6 text-red-500 mr-4 mt-1 flex-shrink-0" />
                                            <p className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{settings.officeAddress}</p>
                                        </div>
                                    </div>
                                </div>
                            </AnimateInView>

                            <AnimateInView>
                                <div className={`backdrop-blur-sm p-8 lg:p-10 rounded-2xl border shadow-2xl shadow-red-500/5 ${theme === 'dark' ? 'bg-black border-gray-800' : 'bg-white/60 border-gray-200'}`}>
                                    <h3 className={`text-2xl font-bold mb-6 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Submit a Support Ticket</h3>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" required className={`w-full p-4 bg-transparent border-b-2 transition text-lg outline-none placeholder:text-gray-500 focus:border-red-500 ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-800'}`} disabled={formLoading} />
                                        </div>
                                        <div>
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className={`w-full p-4 bg-transparent border-b-2 transition text-lg outline-none placeholder:text-gray-500 focus:border-red-500 ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-800'}`} disabled={formLoading} />
                                        </div>
                                        <div>
                                            <textarea rows="5" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Your Complaint/Message" required className={`w-full p-4 bg-transparent border-b-2 transition text-lg outline-none placeholder:text-gray-500 focus:border-red-500 ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-800'}`} disabled={formLoading}></textarea>
                                        </div>
                                        <button type="submit" disabled={formLoading} className="w-full h-16 px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-red-500/20 flex items-center justify-center">
                                            {/* --- MODIFIED: Replaced spinner with simple text --- */}
                                            {formLoading ? 'Submitting...' : 'Submit Ticket'}
                                        </button>
                                    </form>
                                </div>
                            </AnimateInView>
                        </div>
                    </div>
                </section>
                
                <section id="check-ticket" className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="max-w-2xl mx-auto text-center">
                            <AnimateInView>
                                <div className="flex justify-center items-center gap-4 mb-4">
                                    <TicketIcon className="h-10 w-10 text-red-500"/>
                                    <h2 className={`text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        Check Your Ticket
                                    </h2>
                                </div>
                                <p className={`text-lg mb-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Enter your ticket number to see the latest update from our team.
                                </p>
                            </AnimateInView>
                            <AnimateInView>
                                <form onSubmit={handleTicketCheck} className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
                                    <input 
                                        type="text"
                                        value={ticketNumberInput}
                                        onChange={(e) => setTicketNumberInput(e.target.value)}
                                        placeholder="Enter ticket number QF-123ABC"
                                        className={`flex-grow p-4 bg-transparent border-b-2 focus:border-red-500 transition text-lg outline-none placeholder:text-gray-500 font-mono ${theme === 'dark' ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-800'}`}
                                    />
                                    <button type="submit" disabled={ticketLoading} className="h-16 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                                        {/* --- MODIFIED: Replaced spinner with simple text --- */}
                                        {ticketLoading ? 'Checking...' : 'Check Status'}
                                    </button>
                                </form>
                                <div className="mt-6">
                                    {ticketError && <p className="text-red-500 text-center">{ticketError}</p>}
                                    {ticketData && <TicketStatusCard ticket={ticketData} theme={theme} />}
                                </div>
                            </AnimateInView>
                        </div>
                    </div>
                </section>

                {settings.officeLatitude && settings.officeLongitude && (
                    <section id="contact-map" className="py-20 lg:py-28">
                        <div className="container mx-auto px-4">
                            <OfficeMap latitude={settings.officeLatitude} longitude={settings.officeLongitude} zoom={15} title="Our Headquarters" />
                        </div>
                    </section>
                )}

                <section id="faq-section" className="py-20 lg:py-28">
                    <div className="container mx-auto px-4">
                        <AnimateInView>
                            <div className="text-center max-w-3xl mx-auto">
                                <h2 className={`text-4xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
                                <p className={`text-lg mb-12 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Find quick answers to common questions. If you can't find your answer here, please don't hesitate to contact us.
                                </p>
                            </div>
                        </AnimateInView>
                        <AnimateInView>
                            <div className="max-w-4xl mx-auto">
                                {faqs.map((faq, index) => (
                                    <FAQItem key={index} question={faq.question} answer={faq.answer} />
                                ))}
                            </div>
                        </AnimateInView>
                    </div>
                </section>
            </main>
        </div>
    );
}

export default Contact;