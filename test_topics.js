import { TranscriptAnalyzer } from './analyzer.js';

const analyzer = new TranscriptAnalyzer();

const sampleTranscript = `Agent: Good day, you're speaking with an agent from Customer Support. How can I help? | Customer: I'm having an issue with my modem not working. | Agent: I understand, let me review your account and the service in your area. | Agent: Could you please tell me when you first noticed this issue? | Customer: I first noticed it this morning before work. | Agent: Thank you for the details. I'm running diagnostics on your line now. | Agent: The system shows a configuration issue with your current plan. | Agent: I will log a case with our network team and mark it as high priority. | Agent: If the issue continues after this, please contact us again with a screenshot. | Customer: I just tested it and it's working much better now. Thank you so much! | Agent: That's great to hear. I'm glad we could fix it today. | Customer: Really appreciate the quick help. Have a nice day! | Agent: You're very welcome. Have a great day ahead!`;

console.log('Testing topic extraction...');
const topics = analyzer.extractTopics(sampleTranscript);
console.log('Topics result:', JSON.stringify(topics, null, 2));
console.log('Topics length:', topics.length);
