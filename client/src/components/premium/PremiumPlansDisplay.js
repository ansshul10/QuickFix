// quickfix-website/client/src/components/premium/PremiumPlansDisplay.js
import React, { useState, useEffect, useContext } from 'react';
import * as premiumService from '../../services/premiumService';
import LoadingSpinner from '../common/LoadingSpinner';
import { toast } from 'react-toastify';
import { CheckCircleIcon, CurrencyRupeeIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';
import { SUBSCRIPTION_STATUSES } from '../../utils/constants';
import { AuthContext } from '../../context/AuthContext';

function PremiumPlansDisplay({ onSelectPlan, isUserPremium, currentSubscription }) {
    const [plans, setPlans] = useState([]);
    const [loadingPlans, setLoadingPlans] = useState(true); // Renamed for clarity: specific to plans fetch
    const [error, setError] = useState(null);
    const { user } = useContext(AuthContext);

    // No `formLoading` state here as `onSelectPlan` is passed from parent,
    // which should handle the loading of the next step (e.g., payment confirmation form).

    useEffect(() => {
        const fetchPlans = async () => {
            setLoadingPlans(true); // Start loading for plans
            setError(null);

            try {
                const response = await premiumService.getPremiumFeatures();

                if (response && Array.isArray(response.plans)) {
                    setPlans(response.plans);
                } else {
                    setError('Failed to load premium plans: Invalid data format.');
                }
            } catch (err) {
                const errorMessage = err.response?.data?.message || 'Failed to load premium plans.';
                setError(errorMessage);
            } finally {
                setLoadingPlans(false); // Stop loading for plans
            }
        };

        fetchPlans();
    }, []);

    if (loadingPlans) { // Use loadingPlans for this component's specific loading
        return <LoadingSpinner fullScreen={false} message="Loading premium plans..." />;
    }

    if (error) {
        return <div className="text-center text-error dark:text-error-light text-lg mt-8">{error}</div>;
    }

    if (!plans || plans.length === 0) {
        return <div className="text-center text-textDefault dark:text-text-default text-lg mt-8">No premium plans available at the moment. Please check back later.</div>;
    }

    const planOrder = {
        'basic': 1,
        'advanced': 2,
        'pro': 3
    };

    const planStyles = {
        basic: "bg-black text-white ring-1 ring-primary dark:ring-primary-light",
        advanced: "bg-black text-white ring-1 ring-primary dark:ring-primary-light",
        pro: "bg-black text-white ring-1 ring-primary dark:ring-primary-light"
    };

    const buttonStyles = {
        basic: "bg-primary text-white hover:bg-primary-dark",
        advanced: "bg-accent text-white hover:bg-accent-dark",
        pro: "bg-secondary text-white hover:bg-secondary-dark"
    };

    const getButtonText = (plan) => {
        if (!isUserPremium) {
            return `Choose ${plan.displayName}`;
        }

        if (currentSubscription && currentSubscription.status === SUBSCRIPTION_STATUSES.ACTIVE) {
            const currentUserPlanOrder = planOrder[currentSubscription.plan];
            const currentPlanOrder = planOrder[plan.name];

            if (currentUserPlanOrder === undefined || currentPlanOrder === undefined) {
                return `Choose ${plan.displayName}`;
            }

            if (plan.name === currentSubscription.plan) {
                return 'Current Plan';
            } else if (currentPlanOrder > currentUserPlanOrder) {
                return `Upgrade to ${plan.displayName}`;
            } else if (currentPlanOrder < currentUserPlanOrder) {
                return `Downgrade to ${plan.displayName}`;
            }
        }

        return `Choose ${plan.displayName}`;
    };

    const isButtonDisabled = (plan) => {
        // Disable if user email is not verified
        if (user && !user.emailVerified) {
            return true;
        }

        if (!isUserPremium) {
            return currentSubscription &&
                   currentSubscription.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION &&
                   currentSubscription.plan === plan.name;
        }

        if (currentSubscription &&
            currentSubscription.status === SUBSCRIPTION_STATUSES.ACTIVE &&
            plan.name === currentSubscription.plan) {
            return true;
        }

        if (currentSubscription &&
            currentSubscription.status === SUBSCRIPTION_STATUSES.PENDING_MANUAL_VERIFICATION &&
            currentSubscription.plan !== plan.name) {
            return true;
        }

        // Add a check for any active `onSelectPlan` loading if it was passed.
        // This component doesn't manage `onSelectPlan`'s loading, but it might be useful
        // to disable buttons if a payment process has already started.
        // Assuming `onSelectPlan` is a prop from parent like PremiumPage.
        // If `onSelectPlan` passes a loading state, you could use it here.
        // For now, assuming `onSelectPlan` will internally handle its loading.

        return false;
    };

    return (
        <div className="bg-cardBackground dark:bg-card-background rounded-lg shadow-xl p-8 border border-border dark:border-border mt-8">
            <h2 className="text-4xl font-extrabold text-center text-primary dark:text-primary-light mb-8">
                Unlock QuickFix Premium!
            </h2>
            <p className="text-center text-xl text-textSecondary dark:text-text-secondary mb-10 max-w-3xl mx-auto">
                Choose the plan that best fits your needs and gain exclusive access to advanced features, in-depth guides, and an ad-free experience.
            </p>

            {user && !user.emailVerified && (
                <div className="bg-red-100 dark:bg-red-800/20 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-300 p-4 rounded-md flex items-center mb-6 max-w-3xl mx-auto">
                    <ExclamationCircleIcon className="h-6 w-6 mr-3 flex-shrink-0" />
                    <p className="text-sm">
                        Your email address is not verified. You must verify your email before purchasing any premium plan. Please check your profile page or your inbox for the verification link.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {plans.map((plan) => {
                    const buttonText = getButtonText(plan);
                    const disabled = isButtonDisabled(plan);

                    return (
                        <div
                            key={plan.name}
                            className={`flex flex-col rounded-lg shadow-lg p-6 transition-transform transform duration-200 ${planStyles[plan.name] || 'bg-cardBackground dark:bg-card-background text-textDefault dark:text-text-default'}
                                ${plan.name === currentSubscription?.plan && currentSubscription?.status === SUBSCRIPTION_STATUSES.ACTIVE ? 'ring-primary-light dark:ring-primary ring-4' : ''}
                            `}
                        >
                            <h3 className="text-2xl font-bold text-center mb-4 capitalize">
                                {plan.displayName}
                            </h3>
                            <div className="text-center text-4xl font-extrabold mb-6 flex items-center justify-center">
                                <CurrencyRupeeIcon className="h-8 w-8 inline-block mr-2" />
                                {plan.price}
                                <span className="text-lg font-normal text-white text-opacity-75 ml-2">/{plan.duration}</span>
                            </div>
                            <ul className="flex-grow space-y-3 mb-8">
                                {plan.benefits.map((benefit, idx) => (
                                    <li key={idx} className="flex items-center text-white">
                                        <CheckCircleIcon className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                                        <span>{benefit}</span>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => onSelectPlan(plan)}
                                disabled={disabled}
                                className={`w-full py-3 px-6 rounded-md font-semibold text-lg transition-colors hover:scale-105 duration-200 ${buttonStyles[plan.name] || 'bg-primary text-white hover:bg-primary-dark'}
                                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                                `}
                                // Note: If onSelectPlan itself initiates loading, you might need a local state here
                                // to show a spinner in this button. For now, assuming onSelectPlan is fast or
                                // its subsequent UI handles loading.
                            >
                                {buttonText}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default PremiumPlansDisplay;