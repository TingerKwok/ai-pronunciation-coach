import { PracticeData, PracticeLevel } from './types';

export const PRACTICE_DATA: PracticeData = {
  [PracticeLevel.Phonemes]: [
    {
      title: 'Vowels (元音)',
      categories: [
        {
          title: 'Long Vowels (长元音)',
          items: [
            { text: '/iː/', ipa: '/iː/', exampleWord: 'see', speakableText: 'ee' },
            { text: '/ɜː/', ipa: '/ɜː/', exampleWord: 'bird', speakableText: 'er' },
            { text: '/ɑː/', ipa: '/ɑː/', exampleWord: 'father', speakableText: 'ah' },
            { text: '/ɔː/', ipa: '/ɔː/', exampleWord: 'saw', speakableText: 'aw' },
            { text: '/uː/', ipa: '/uː/', exampleWord: 'blue', speakableText: 'oo' },
          ],
        },
        {
          title: 'Short Vowels (短元音)',
          items: [
            { text: '/ɪ/', ipa: '/ɪ/', exampleWord: 'sit', speakableText: 'ih' },
            { text: '/e/', ipa: '/e/', exampleWord: 'bed', speakableText: 'eh' },
            { text: '/æ/', ipa: '/æ/', exampleWord: 'cat', speakableText: 'a' },
            { text: '/ə/', ipa: '/ə/', exampleWord: 'about', speakableText: 'uh' },
            { text: '/ʌ/', ipa: '/ʌ/', exampleWord: 'cup', speakableText: 'uh' },
            { text: '/ɒ/', ipa: '/ɒ/', exampleWord: 'pot', speakableText: 'o' },
            { text: '/ʊ/', ipa: '/ʊ/', exampleWord: 'put', speakableText: 'u' },
          ],
        },
        {
          title: 'Diphthongs (双元音)',
          items: [
            { text: '/eɪ/', ipa: '/eɪ/', exampleWord: 'say', speakableText: 'ay' },
            { text: '/aɪ/', ipa: '/aɪ/', exampleWord: 'my', speakableText: 'eye' },
            { text: '/ɔɪ/', ipa: '/ɔɪ/', exampleWord: 'boy', speakableText: 'oy' },
            { text: '/aʊ/', ipa: '/aʊ/', exampleWord: 'now', speakableText: 'ow' },
            { text: '/əʊ/', ipa: '/əʊ/', exampleWord: 'go', speakableText: 'oh' },
            { text: '/ɪə/', ipa: '/ɪə/', exampleWord: 'here', speakableText: 'ear' },
            { text: '/eə/', ipa: '/eə/', exampleWord: 'hair', speakableText: 'air' },
            { text: '/ʊə/', ipa: '/ʊə/', exampleWord: 'tour', speakableText: 'oor' },
          ],
        },
      ],
    },
    {
      title: 'Consonants (辅音)',
      categories: [
        {
          title: 'Voiceless Consonants (清辅音)',
          items: [
            { text: '/p/', ipa: '/p/', exampleWord: 'pen', speakableText: 'puh' },
            { text: '/t/', ipa: '/t/', exampleWord: 'tea', speakableText: 'tuh' },
            { text: '/k/', ipa: '/k/', exampleWord: 'cat', speakableText: 'kuh' },
            { text: '/f/', ipa: '/f/', exampleWord: 'fan', speakableText: 'fff' },
            { text: '/s/', ipa: '/s/', exampleWord: 'see', speakableText: 'sss' },
            { text: '/ʃ/', ipa: '/ʃ/', exampleWord: 'she', speakableText: 'sh' },
            { text: '/θ/', ipa: '/θ/', exampleWord: 'think', speakableText: 'thhh' },
            { text: '/h/', ipa: '/h/', exampleWord: 'hot', speakableText: 'huh' },
            { text: '/tʃ/', ipa: '/tʃ/', exampleWord: 'chair', speakableText: 'ch' },
            { text: '/tr/', ipa: '/tr/', exampleWord: 'try', speakableText: 'tr' },
            { text: '/ts/', ipa: '/ts/', exampleWord: 'cats', speakableText: 'ts' },
          ],
        },
        {
          title: 'Voiced Consonants (浊辅音)',
          items: [
            { text: '/b/', ipa: '/b/', exampleWord: 'bad', speakableText: 'buh' },
            { text: '/d/', ipa: '/d/', exampleWord: 'did', speakableText: 'duh' },
            { text: '/g/', ipa: '/g/', exampleWord: 'go', speakableText: 'guh' },
            { text: '/v/', ipa: '/v/', exampleWord: 'van', speakableText: 'vvv' },
            { text: '/z/', ipa: '/z/', exampleWord: 'zoo', speakableText: 'zzz' },
            { text: '/ʒ/', ipa: '/ʒ/', exampleWord: 'vision', speakableText: 'zh' },
            { text: '/ð/', ipa: '/ð/', exampleWord: 'this', speakableText: 'thz' },
            { text: '/r/', ipa: '/r/', exampleWord: 'red', speakableText: 'rrr' },
            { text: '/dʒ/', ipa: '/dʒ/', exampleWord: 'jam', speakableText: 'j' },
            { text: '/dr/', ipa: '/dr/', exampleWord: 'dry', speakableText: 'dr' },
            { text: '/dz/', ipa: '/dz/', exampleWord: 'beds', speakableText: 'ds' },
            { text: '/m/', ipa: '/m/', exampleWord: 'man', speakableText: 'mmm' },
            { text: '/n/', ipa: '/n/', exampleWord: 'no', speakableText: 'nnn' },
            { text: '/ŋ/', ipa: '/ŋ/', exampleWord: 'sing', speakableText: 'ng' },
            { text: '/l/', ipa: '/l/', exampleWord: 'leg', speakableText: 'lll' },
            { text: '/w/', ipa: '/w/', exampleWord: 'wet', speakableText: 'w' },
            { text: '/j/', ipa: '/j/', exampleWord: 'yes', speakableText: 'y' },
          ],
        },
      ],
    },
  ],
  [PracticeLevel.Words]: [
    { text: 'apple', ipa: '/ˈæpəl/' },
    { text: 'beautiful', ipa: '/ˈbjuːtɪfəl/' },
    { text: 'pronunciation', ipa: '/prəˌnʌnsiˈeɪʃən/' },
    { text: 'language', ipa: '/ˈlæŋɡwɪdʒ/' },
    { text: 'technology', ipa: '/tɛkˈnɒlədʒi/' },
    { text: 'communication', ipa: '/kəˌmjuːnɪˈkeɪʃən/' },
    { text: 'exercise', ipa: '/ˈɛksərsaɪz/' },
    { text: 'environment', ipa: '/ɪnˈvaɪrənmənt/' },
  ],
  [PracticeLevel.Phrases]: [
    { text: 'nice to meet you', ipa: '/naɪs tə miːt juː/' },
    { text: 'how are you doing', ipa: '/haʊ ər juː ˈduːɪŋ/' },
    { text: 'I appreciate it', ipa: '/aɪ əˈpriːʃiˌeɪt ɪt/' },
    { text: 'Could you please repeat that?', ipa: '/kʊd juː pliːz rɪˈpiːt ðæt/' },
    { text: 'on the other hand', ipa: '/ɑːn ðə ˈʌðər hænd/' },
  ],
  [PracticeLevel.Sentences]: [
    { text: 'The quick brown fox jumps over the lazy dog.', ipa: '/ðə kwɪk braʊn fɑːks dʒʌmps ˈoʊvər ðə ˈleɪzi dɔːɡ/' },
    { text: 'Practice makes perfect.', ipa: '/ˈpræktɪs meɪks ˈpɜːrfɪkt/' },
    { text: 'I am learning to speak English more fluently.', ipa: '/aɪ æm ˈlɜːrnɪŋ tuː spiːk ˈɪŋɡlɪʃ mɔːr ˈfluːəntli/' },
    { text: 'She sells seashells by the seashore.', ipa: '/ʃiː sɛlz ˈsiːʃɛlz baɪ ðə ˈsiːʃɔːr/' },
  ],
};