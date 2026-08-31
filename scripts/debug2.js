const https = require('https');
https.get('https://github.com/users/WIKItills/contributions', {
  headers: { 'User-Agent': 'profile-readme-bot/1.0' }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    // Find a sample td element
    const idx = d.indexOf('ContributionCalendar-day');
    if (idx > -1) {
      // Find the start of this td tag
      let start = d.lastIndexOf('<td', idx);
      let end = d.indexOf('>', idx) + 1;
      console.log('Sample td:');
      console.log(d.substring(start, end));
      console.log('\n---\n');
      
      // Find another one (different)
      const idx2 = d.indexOf('ContributionCalendar-day', end);
      if (idx2 > -1) {
        let start2 = d.lastIndexOf('<td', idx2);
        let end2 = d.indexOf('>', idx2) + 1;
        console.log('Second td:');
        console.log(d.substring(start2, end2));
      }
    }
  });
});
