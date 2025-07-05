// quickfix-website/client/src/components/common/Breadcrumbs.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid';
import { capitalizeFirstLetter } from '../../utils/formatters';

function Breadcrumbs({ customSegments = [] }) {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  // If custom segments are provided, prioritize them
  const segments = customSegments.length > 0 ? customSegments : pathnames;

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
        <li>
          <div>
            <Link to="/" className="text-gray-400 hover:text-gray-500 transition-colors">
              <HomeIcon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <span className="sr-only">Home</span>
            </Link>
          </div>
        </li>
        {segments.map((value, index) => {
          // If custom segments are used, 'value' might be an object { name, path }
          const isCustomObject = typeof value === 'object' && value !== null;
          const segmentName = isCustomObject ? value.name : capitalizeFirstLetter(value.replace(/-/g, ' '));
          const to = isCustomObject ? value.path : `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === segments.length - 1;

          return (
            <li key={to} className="flex items-center">
              <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
              <Link
                to={to}
                className={`ml-2 text-sm font-medium ${
                  isLast ? 'text-textDefault dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {segmentName}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;