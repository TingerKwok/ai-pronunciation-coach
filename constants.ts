import { PracticeData, PracticeLevel } from './types';

export const PRACTICE_DATA: PracticeData = {
  [PracticeLevel.Phonemes]: [
    {
      title: 'Vowels (元音)',
      categories: [
        {
          title: 'Long Vowels (长元音)',
          items: [
            { text: '/iː/', ipa: '/iː/', exampleWord: 'see', speakableText: 'sea', refAudioUrl: 'ipasounds/i-long.mp3' },
            { text: '/ɜː/', ipa: '/ɜː/', exampleWord: 'bird', speakableText: 'serve', refAudioUrl: 'ipasounds/er-long.mp3' },
            { text: '/ɑː/', ipa: '/ɑː/', exampleWord: 'father', speakableText: 'art', refAudioUrl: 'ipasounds/a-long.mp3' },
            { text: '/ɔː/', ipa: '/ɔː/', exampleWord: 'saw', speakableText: 'awe', refAudioUrl: 'ipasounds/o-long.mp3' },
            { text: '/uː/', ipa: '/uː/', exampleWord: 'blue', speakableText: 'ooze', refAudioUrl: 'ipasounds/u-long.mp3' },
          ],
        },
        {
          title: 'Short Vowels (短元音)',
          items: [
            { text: '/ɪ/', ipa: '/ɪ/', exampleWord: 'sit', speakableText: 'it', refAudioUrl: 'ipasounds/i-short.mp3' },
            { text: '/e/', ipa: '/e/', exampleWord: 'bed', speakableText: 'egg', refAudioUrl: 'ipasounds/e-short.mp3' },
            { text: '/æ/', ipa: '/æ/', exampleWord: 'cat', speakableText: 'at', refAudioUrl: 'ipasounds/ae.mp3' },
            { text: '/ə/', ipa: '/ə/', exampleWord: 'about', speakableText: 'ago', refAudioUrl: 'ipasounds/schwa.mp3' },
            { text: '/ʌ/', ipa: '/ʌ/', exampleWord: 'cup', speakableText: 'up', refAudioUrl: 'ipasounds/u-short.mp3' },
            { text: '/ɒ/', ipa: '/ɒ/', exampleWord: 'pot', speakableText: 'ox', refAudioUrl: 'ipasounds/o-short.mp3' },
            { text: '/ʊ/', ipa: '/ʊ/', exampleWord: 'put', speakableText: 'put', refAudioUrl: 'ipasounds/u-short-hook.mp3' },
          ],
        },
        {
          title: 'Diphthongs (双元音)',
          items: [
            { text: '/eɪ/', ipa: '/eɪ/', exampleWord: 'say', speakableText: 'eight', refAudioUrl: 'ipasounds/ei.mp3' },
            { text: '/aɪ/', ipa: '/aɪ/', exampleWord: 'my', speakableText: 'eye', refAudioUrl: 'ipasounds/ai.mp3' },
            { text: '/ɔɪ/', ipa: '/ɔɪ/', exampleWord: 'boy', speakableText: 'oil', refAudioUrl: 'ipasounds/oi.mp3' },
            { text: '/aʊ/', ipa: '/aʊ/', exampleWord: 'now', speakableText: 'ouch', refAudioUrl: 'ipasounds/au.mp3' },
            { text: '/əʊ/', ipa: '/əʊ/', exampleWord: 'go', speakableText: 'oh', refAudioUrl: 'ipasounds/ou.mp3' },
            { text: '/ɪə/', ipa: '/ɪə/', exampleWord: 'here', speakableText: 'ear', refAudioUrl: 'ipasounds/ie.mp3' },
            { text: '/eə/', ipa: '/eə/', exampleWord: 'hair', speakableText: 'air', refAudioUrl: 'ipasounds/ee.mp3' },
            { text: '/ʊə/', ipa: '/ʊə/', exampleWord: 'tour', speakableText: 'tour', refAudioUrl: 'ipasounds/ue.mp3' },
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
            { text: '/p/', ipa: '/p/', exampleWord: 'pen', speakableText: 'pea', refAudioUrl: 'ipasounds/p.mp3' },
            { text: '/t/', ipa: '/t/', exampleWord: 'tea', speakableText: 'tea', refAudioUrl: 'ipasounds/t.mp3' },
            { text: '/k/', ipa: '/k/', exampleWord: 'cat', speakableText: 'key', refAudioUrl: 'ipasounds/k.mp3' },
            { text: '/f/', ipa: '/f/', exampleWord: 'fan', speakableText: 'fee', refAudioUrl: 'ipasounds/f.mp3' },
            { text: '/s/', ipa: '/s/', exampleWord: 'see', speakableText: 'sea', refAudioUrl: 'ipasounds/s.mp3' },
            { text: '/ʃ/', ipa: '/ʃ/', exampleWord: 'she', speakableText: 'she', refAudioUrl: 'ipasounds/sh.mp3' },
            { text: '/θ/', ipa: '/θ/', exampleWord: 'think', speakableText: 'thin', refAudioUrl: 'ipasounds/th-voiceless.mp3' },
            { text: '/h/', ipa: '/h/', exampleWord: 'hot', speakableText: 'he', refAudioUrl: 'ipasounds/h.mp3' },
            { text: '/tʃ/', ipa: '/tʃ/', exampleWord: 'chair', speakableText: 'chin', refAudioUrl: 'ipasounds/ch.mp3' },
            { text: '/tr/', ipa: '/tr/', exampleWord: 'try', speakableText: 'try', refAudioUrl: 'ipasounds/tr.mp3' },
            { text: '/ts/', ipa: '/ts/', exampleWord: 'cats', speakableText: 'cats', refAudioUrl: 'ipasounds/ts.mp3' },
          ],
        },
        {
          title: 'Voiced Consonants (浊辅音)',
          items: [
            { text: '/b/', ipa: '/b/', exampleWord: 'bad', speakableText: 'bee', refAudioUrl: 'ipasounds/b.mp3' },
            { text: '/d/', ipa: '/d/', exampleWord: 'did', speakableText: 'day', refAudioUrl: 'ipasounds/d.mp3' },
            { text: '/g/', ipa: '/g/', exampleWord: 'go', speakableText: 'go', refAudioUrl: 'ipasounds/g.mp3' },
            { text: '/v/', ipa: '/v/', exampleWord: 'van', speakableText: 'vie', refAudioUrl: 'ipasounds/v.mp3' },
            { text: '/z/', ipa: '/z/', exampleWord: 'zoo', speakableText: 'zoo', refAudioUrl: 'ipasounds/z.mp3' },
            { text: '/ʒ/', ipa: '/ʒ/', exampleWord: 'vision', speakableText: 'Asia', refAudioUrl: 'ipasounds/zh.mp3' },
            { text: '/ð/', ipa: '/ð/', exampleWord: 'this', speakableText: 'the', refAudioUrl: 'ipasounds/th-voiced.mp3' },
            { text: '/r/', ipa: '/r/', exampleWord: 'red', speakableText: 'ray', refAudioUrl: 'ipasounds/r.mp3' },
            { text: '/dʒ/', ipa: '/dʒ/', exampleWord: 'jam', speakableText: 'jay', refAudioUrl: 'ipasounds/dzh.mp3' },
            { text: '/dr/', ipa: '/dr/', exampleWord: 'dry', speakableText: 'dry', refAudioUrl: 'ipasounds/dr.mp3' },
            { text: '/dz/', ipa: '/dz/', exampleWord: 'beds', speakableText: 'beds', refAudioUrl: 'ipasounds/dz.mp3' },
            { text: '/m/', ipa: '/m/', exampleWord: 'man', speakableText: 'me', refAudioUrl: 'ipasounds/m.mp3' },
            { text: '/n/', ipa: '/n/', exampleWord: 'no', speakableText: 'knee', refAudioUrl: 'ipasounds/n.mp3' },
            { text: '/ŋ/', ipa: '/ŋ/', exampleWord: 'sing', speakableText: 'sing', refAudioUrl: 'ipasounds/ng.mp3' },
            { text: '/l/', ipa: '/l/', exampleWord: 'leg', speakableText: 'lee', refAudioUrl: 'ipasounds/l.mp3' },
            { text: '/w/', ipa: '/w/', exampleWord: 'wet', speakableText: 'we', refAudioUrl: 'ipasounds/w.mp3' },
            { text: '/j/', ipa: '/j/', exampleWord: 'yes', speakableText: 'yea', refAudioUrl: 'ipasounds/y.mp3' },
          ],
        },
      ],
    },
  ],
  [PracticeLevel.Words]: [],
  [PracticeLevel.Phrases]: [],
  [PracticeLevel.Sentences]: [],
};