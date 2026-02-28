import { format } from 'date-fns';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { DailyRecord, UserProfile } from './storage';
import { calculateDailyTotalMinutes, formatTime } from './time';

export async function generatePDFReport(records: DailyRecord[], profile: UserProfile) {
  const html = `
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          @page { margin: 20mm; }
          body { 
            font-family: 'Times New Roman', Times, serif; 
            padding: 0; 
            color: #000; 
            line-height: 1.2;
          }
          .container { max-width: 800px; margin: auto; }
          .form-number { text-align: left; font-size: 10px; font-style: italic; margin-bottom: 5px; }
          .header { text-align: center; margin-bottom: 20px; }
          .header h1 { font-size: 18px; text-transform: uppercase; margin: 0; letter-spacing: 1px; }
          .header p { font-size: 14px; margin: 5px 0; }
          
          .profile-section { margin-bottom: 15px; border-bottom: 2px solid #000; padding-bottom: 10px; }
          .profile-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
          .profile-label { font-weight: bold; text-transform: uppercase; font-size: 12px; }
          .profile-value { border-bottom: 1px solid #000; flex: 1; margin-left: 10px; font-size: 14px; padding-left: 5px; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { 
            border: 1px solid #000; 
            text-align: center; 
            padding: 8px 4px; 
            font-size: 10px; 
            text-transform: uppercase; 
            background: #eee;
          }
          td { 
            border: 1px solid #000; 
            padding: 6px 4px; 
            text-align: center; 
            font-size: 11px; 
          }
          .date-col { font-weight: bold; width: 60px; }
          
          .certification { margin-top: 25px; font-size: 12px; text-align: justify; }
          .signatures { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
          .sig-box { text-align: center; width: 45%; }
          .sig-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; font-size: 12px; text-transform: uppercase; font-weight: bold; }
          .sig-label { font-size: 10px; font-style: italic; margin-top: 2px; }
          
          .footer { margin-top: 30px; font-size: 9px; text-align: center; color: #666; font-style: italic; border-top: 1px dotted #ccc; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="form-number">Civil Service Form No. 48</div>
          
          <div class="header">
            <h1>Daily Time Record</h1>
            <p>--- o ---</p>
          </div>

          <div class="profile-section">
            <div class="profile-row">
              <span class="profile-label">Name:</span>
              <span class="profile-value">${profile.name?.toUpperCase() || '__________________________'}</span>
            </div>
            <div class="profile-row">
              <span class="profile-label">Month of:</span>
              <span class="profile-value">${format(new Date(), 'MMMM yyyy')}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th rowspan="2">Day</th>
                <th colspan="2">A.M.</th>
                <th colspan="2">P.M.</th>
                <th colspan="2">Undertime / OT</th>
              </tr>
              <tr>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Arrival</th>
                <th>Departure</th>
                <th>Hours</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              ${Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = format(new Date(new Date().getFullYear(), new Date().getMonth(), day), 'yyyy-MM-dd');
    const record = records.find(r => r.date === dateStr);

    return `
                  <tr>
                    <td class="date-col">${day}</td>
                    <td>${formatTime(record?.morningIn) || ''}</td>
                    <td>${formatTime(record?.morningOut) || ''}</td>
                    <td>${formatTime(record?.afternoonIn) || ''}</td>
                    <td>${formatTime(record?.afternoonOut) || ''}</td>
                    <td>${record ? Math.floor(calculateDailyTotalMinutes(record) / 60) : ''}</td>
                    <td>${record ? calculateDailyTotalMinutes(record) % 60 : ''}</td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>

          <div class="certification">
            I certify on my honor that the above is a true and correct report of the hours of work 
            performed, record of which was made daily at the time of arrival and departure from office.
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line">${profile.name?.toUpperCase() || '__________________________'}</div>
              <div class="sig-label">Employee / Intern Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line">__________________________</div>
              <div class="sig-label">Verified Correct (Supervisor)</div>
            </div>
          </div>

          <div class="footer">
            Digital Replica - Generated via DTR Tracker v${format(new Date(), 'yyyy.MM.dd')}
          </div>
        </div>
      </body>
    </html>
  `;

  console.log('[DEBUG] Platform.OS:', Platform.OS);

  if (Platform.OS === 'web') {
    console.log('[DEBUG] Running on Web - calling printAsync');
    await Print.printAsync({ html });
  } else {
    console.log('[DEBUG] Running on Native - calling printToFileAsync');
    try {
      const result = await Print.printToFileAsync({ html });
      if (result && result.uri) {
        await Sharing.shareAsync(result.uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        console.warn('[DEBUG] printToFileAsync returned no URI');
      }
    } catch (err) {
      console.error('[DEBUG] PDF Generation Error:', err);
    }
  }
}
