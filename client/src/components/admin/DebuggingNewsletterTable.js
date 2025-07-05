// quickfix-website/client/src/components/admin/DebuggingNewsletterTable.js
import React from 'react';

function DebuggingNewsletterTable({ subscribers }) {
    if (!subscribers || subscribers.length === 0) {
        return <p style={{ textAlign: 'center', color: 'red', fontSize: '18px', marginTop: '20px' }}>No subscribers to display in debugging table.</p>;
    }

    return (
        <div style={{ overflowX: 'auto', border: '2px solid purple', margin: '20px 0', backgroundColor: 'lightgray' }}>
            <h4 style={{ textAlign: 'center', color: 'darkblue', margin: '10px 0' }}>--- DEBUGGING TABLE ---</h4>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#ccc' }}>
                    <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'black' }}>Email (Debug)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'black' }}>Status (Debug)</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid #ddd', color: 'black' }}>Subscribed At (Debug)</th>
                    </tr>
                </thead>
                <tbody>
                    {subscribers.map((subscriberItem) => (
                        <tr key={subscriberItem._id} style={{ borderBottom: '1px solid #eee' }}>
                            {/* EXTREME INLINE STYLES FOR VISIBILITY */}
                            <td style={{
                                padding: '12px',
                                whiteSpace: 'nowrap',
                                color: 'black !important',         // FORCE BLACK TEXT
                                backgroundColor: 'yellow !important', // FORCE YELLOW BACKGROUND
                                fontSize: '18px !important',       // FORCE LARGE FONT
                                fontWeight: 'bold !important',     // FORCE BOLD
                                display: 'table-cell !important',  // ENSURE DISPLAY IS NOT NONE
                                visibility: 'visible !important',  // ENSURE VISIBLE
                                opacity: '1 !important',           // ENSURE FULL OPACITY
                                border: '3px dashed red !important' // ADD BORDER
                            }}>
                                {subscriberItem.email}
                            </td>
                            <td style={{ padding: '8px', whiteSpace: 'nowrap', color: 'black' }}>
                                {subscriberItem.active ? 'Active' : 'Inactive'}
                            </td>
                            <td style={{ padding: '8px', whiteSpace: 'nowrap', color: 'black' }}>
                                {new Date(subscriberItem.subscribedAt).toLocaleDateString()}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <h4 style={{ textAlign: 'center', color: 'darkblue', margin: '10px 0' }}>--- END DEBUGGING TABLE ---</h4>
        </div>
    );
}

export default DebuggingNewsletterTable;