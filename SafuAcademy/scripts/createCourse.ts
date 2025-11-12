import hre from 'hardhat'
import 'dotenv/config'
export interface Lesson {
  id: number
  lessontitle: string
  url: string[]
  quizzes: string
}

export interface Course {
  id: number
  title: string
  description: string
  longDescription: string
  objectives: string[]
  instructor: string
  url: string
  level: string
  category: string
  prerequisites: string[]
  lessons: Lesson[]
  duration: string
}

async function main() {
  const { ethers } = hre

  const courses: Course[] = [
   /* {
      id: 0,
      title: 'Using Hooks And Headlines To Grab Attention',
      description:
        'Learn how to craft scroll-stopping hooks, irresistible headlines, and intros that keep readers glued — even if writing isn’t your full-time gig.',
      longDescription: `Ever pour your heart into a blog post, only for it to vanish into the internet void? You're not alone — and it's not your fault. Most content struggles to grab attention simply because it misses the mark in the first 10 seconds.\n
In this course, your guide Kayla breaks down how to turn passive readers into eager sharers. Using relatable examples and proven formulas, you'll learn how to write magnetic hooks, emotional headlines, and sticky intros that get real results. Whether you're writing for a personal brand, small business, or blog audience, this course will give you the confidence and tools to make your content pop.\n
By the end of this quick, fun-packed journey, you’ll have a content creation system that feels natural, authentic, and actually gets noticed.`,
      level: 'Beginner',
      category: 'Starter',
      url: 'https://ipfs.io/ipfs/bafkreibrc7o6iwtf4oneh333scyde2itaxqzv6ym6fg74hhwbd2lu2lfma',
      instructor: 'Kayla',
      lessons: [
        {
          id: 0,
          lessontitle: 'Intro: Hooks & Headlines',
          url: [
            'bafybeigzwcs7gvrwvkjxz37zt2ut4pwr46glvo5ymw74s6ojpe5evnmd2e',
            'bafybeid5ijq6qhmpyolqh2px4j5adwqjnafpbxeokwocrkdrsb6u2mikpq',
          ],
          quizzes: '',
        },
        {
          id: 1,
          lessontitle: "What's a Hook and Why Should I Care",
          url: [
            'bafybeigonupgx3bh7bz4ma4luxkkd67eg44ki6v2fj6amsdjfo3s4sbh2m',
            'bafybeialzvqlamxbzawrjqmdhvk7pqnak7hoc3eeu2vo6hklgzobb7rmwy',
          ],
          quizzes: '',
        },
        {
          id: 2,
          lessontitle: "How to Get Inside your Reader's Head",
          url: [
            'bafybeidk4lc7vhzdg325rgqb2o45g6f7cxklo2v5uu7nahfqf2k5pkeqvy',
            'bafybeigit5jowkqw2owb67opjf3xgmq6732hip5ufdfigvlha6mguacs2q',
          ],
          quizzes: '',
        },
        {
          id: 3,
          lessontitle: 'The Instant Headline Formula',
          url: [
            'bafybeickzg4hwmfit5cbio6zflfxjvzeds2kd5fshkvfv3jtjmsg35ll4q',
            'bafybeidsefj7gjvhbl3lea47a3o2bnt2s4azuyfzx265l7vne4crm3zkci',
          ],
          quizzes: '',
        },
        {
          id: 4,
          lessontitle: 'Use These Tools to Find Headline Gold',
          url: [
            'bafybeibcas3ve4npiug3b7xzo5pbi5dvb3k7twkdc6qszklusb3rnkueti',
            'bafybeiamfule2os7saooxpbookdooyxobt3gdhj2zbk66zzhivvyqd2zym',
          ],
          quizzes: '',
        },
        {
          id: 5,
          lessontitle: 'The Blog Intro Cheat Code',
          url: [
            'bafybeienomdt275bni6aoxkrkdfvtq552qgjlkcp2wkv4hmyszftm7mb6q',
            'bafybeiddh4qo6rebcyr7juudis4xuegoxp7isnsegemkfngyavvc6lpicm',
          ],
          quizzes: '',
        },
        {
          id: 6,
          lessontitle: 'Recap: What You Have Just Learned',
          url: [
            'bafybeibggqo3ym2rfpp6zfcamkunft4j4dxtaefc52biqkwmdu5w43m7y4',
            'bafybeieigphtm2eer4rovxkwkfyx5tb22zui2dmkih5ylfm32pgimn56ve',
          ],
          quizzes: '',
        },
      ],
      prerequisites: ['Minted .safu domain'],
      objectives: [
        'Write powerful hooks that emotionally connect and grab attention within seconds.',
        'Understand audience on a deeper level.',
        'Apply a proven headline formula to create compelling, share-worthy titles.',
        'Use tools like CoSchedule and AnswerThePublic to brainstorm high-impact content ideas.',
        'Craft blog intros that retain readers, using a simple 3-step structure.',
      ],
      duration: '30',
    },
   /* {
      id: 1,
      title: 'Personal Branding For Modern Creators',
      description:
        'Learn how to shape your digital presence with clarity, confidence, and consistency across platforms.',
      longDescription:
        "In today's digital world, your personal brand is your reputation, your resume, and your silent pitch, all rolled into one. Whether you’re a student, safu, freelancer, or builder, how people perceive you online shapes your opportunities. But here’s the truth: you already have a brand, whether you're managing it or not.\nIn this course, Joshua guides you through building a strong, intentional personal brand that communicates your value, attracts the right people, and grows over time. You'll learn how to define your story, create a sticky tagline, use profile pictures and safu domains to stand out, and build a content strategy that grows your influence, one post at a time.\nNo fluff, no faking it, just a clear roadmap to owning your story and showing up with purpose.",
      level: 'Beginner',
      category: 'Starter',
      url: 'https://ipfs.io/ipfs/bafkreifzjlpv7d42wjy35fpimhxidwriu22sxgxryfzu2bs5rhs53u4gw4',
      instructor: 'Joshua',
      lessons: [
        {
          id: 0,
          lessontitle: 'Intro: Personal Branding For Modern Creators',
          url: ['bafybeihtynz62ubhh66f6ta5fg6qpslbjoxjziw6sfxgjouqrdwt6gokam'],
          quizzes: '',
        },
        {
          id: 1,
          lessontitle: "The Story You're Already Telling",
          url: ['bafybeigekbiytfsl2zmz6nlfojgrt3umjzr4q6mhl273anucyozmprdphy'],
          quizzes: '',
        },
        {
          id: 2,
          lessontitle: 'Discover Your Why',
          url: ['bafybeiengyglqayflmydn6pfk52r5weqa4ikfdsfsvfgh6fancemwp2y4m'],
          quizzes: '',
        },
        {
          id: 3,
          lessontitle: 'Say it In 8 Words Or Less',
          url: ['bafybeigjwo7mzijttglhno5kxd3wrmcfbyypo2bbwp33bkxwatlatt5hsy'],
          quizzes: '',
        },
        {
          id: 4,
          lessontitle: 'NFT Avatars + .safu Domains',
          url: ['bafybeicfwrrrmdtnmbwxzg5undmtb4gitmzlhgn5wp5l5phfuzgm5udtzu'],
          quizzes: '',
        },
        {
          id: 5,
          lessontitle: 'Choose Your Channels',
          url: ['bafybeibctumd3bcxxi6oc4ugyeqgcpja5zyici6lmvlaiwurggtyxx36vm'],
          quizzes: '',
        },
        {
          id: 6,
          lessontitle: 'Optimize Your Profiles',
          url: ['bafybeig7ir764i6ldakajezireywcqmsl2f7vqxr3stdax4qly6mnwkyfe'],
          quizzes: '',
        },
        {
          id: 7,
          lessontitle: 'Listen Before You Shout',
          url: ['bafybeiboq5ft26rsczj2ww2erlblazhkwdcvf7cgg5tug5jruralrq7pju'],
          quizzes: '',
        },
        {
          id: 8,
          lessontitle: 'Be Known For Something',
          url: ['bafybeieijzbfwviwsirxpwy7n6qg7wmv3sznsigwtp5t7idwkhmalc77jm'],
          quizzes: '',
        },
        {
          id: 9,
          lessontitle: 'Recap',
          url: ['bafybeigldolq7ttfjtvsnrrny7lakfche6ygxgxzyjkzwj7lbtzkcz44aq'],
          quizzes: '',
        },
      ],
      prerequisites: ['Minted .safu domain'],
      objectives: [
        'Define and communicate personal brand using a clear, concise, and memorable tagline.',
        'Craft consistent and compelling profiles across platforms using visuals, bios, and domain names.',
        'Choose the right platforms to build visibility based on their personality and niche.',
        'Engage authentically with others online, from replying to joining conversations and curating content.',
        'Build long-term influence through consistent storytelling, content creation, and community interaction.',
      ],
      duration: '30',
    }, */
    /* {
      id: 0,
      title: 'On-Chain and Unshaken: The Web3 Security Playbook',
      description:
        'This course walks you through real-life scenarios, common threats, and foolproof strategies — so you stay in control, not the scammers.',
      longDescription: `With billions lost to scams, phishing attacks, and wallet drainers, the need for practical, easy-to-follow security education has never been greater.\n
This course is your guide to navigating the minefield of Web3 safely. Through the stories of Jude and Jane, you'll learn to spot the red flags, avoid common traps, and set up strong defenses around your digital assets. Whether you've already fallen victim or just want to stay ahead of the curve, this course arms you with the knowledge, tools, and mindset to stay secure in the wild world of crypto.\n
By the end, you'll feel confident managing wallets, recognizing scams, and protecting your assets like a pro — no technical background needed.`,
      level: 'Beginner',
      category: 'Starter',
      url: 'https://ipfs.io/ipfs/bafkreidp7qzbkip7sti5nxcx6jkpzolum7busdxk6x2pbsqvfcnygn3vxq',
      instructor: 'Donna Hill',
      lessons: [
        {
          id: 0,
          lessontitle: 'On-Chain and Unshaken: The Web3 Security Playbook',
          url: [
            'bafybeiektu4svdpw5ndp7mh6iqcyvc4t2qsm7b55kh5amqrg2mnwr2rrby',
            'bafybeidlc4eb2blxfiyjvop4btew2jx65ycur4bc3pitqh2nmcu2353ye4',
          ],
          quizzes: '',
        },
        {
          id: 1,
          lessontitle: 'Understanding Common Threats in Web3',
          url: [
            'bafybeieaxyvjsctks3ed3t4trdfqhj6xgn3xzmp7gyw6qpfeuwd2a2blae',
            'bafybeihhw7zt7u4j32wbq7h46axjni552fk7t2ph7h3tqwi4nej4foqhqy',
          ],
          quizzes: '',
        },
        {
          id: 2,
          lessontitle: 'Social Engineering Manipulating Human Trust',
          url: [
            'bafybeidoudou7uyonx7ys5wy2usicstrepzxtxrmje3o5hcaaf5nxjzgeq',
            'bafybeic55w6kfht2aae3q77fbcgqagymbvaoa7jm466oiw4ibdtdjrk73q',
          ],
          quizzes: '',
        },
        {
          id: 3,
          lessontitle: 'Wallet Approvals And Permit Scams',
          url: [
            'bafybeicvna2v7flq7sanlp5ufsmg3s7kmorfj3iffjklkfmkcwifkl7qb4',
            'bafybeibil7oarx27234i74laqobo6emjb7zsdacpsumayhpwfwlm7bacoq',
          ],
          quizzes: '',
        },
        {
          id: 4,
          lessontitle: 'Discords, Telegrams and Community Traps',
          url: [
            'bafybeidynylktdz5eotro775xbomakvo3p3yldzqgjxkqez6alchi4sjuu',
            'bafybeid7kvnt4fppgmfyfzprbhyqwvu3gikxqw4vgepmprc2dvhdxneiqm',
          ],
          quizzes: '',
        },
        {
          id: 5,
          lessontitle: 'Browser Hygiene and Safer Surfing',
          url: [
            'bafybeiahvqotiabifgxlxq5zwy5dhudpopmifrfing4ssfut4hk35nrkri',
            'bafybeih62reikuxmp7ql3hpmxqhfj5dtnk5mesqpnbi4reortjwvsqyz4i',
          ],
          quizzes: '',
        },
        {
          id: 6,
          lessontitle: 'Wallet Segregation: Creating Firewalls for Your Funds',
          url: [
            'bafybeih6edbvcxbbl4t2oa4ihbylvwylfowcabs766fr3j3ubfc3onuyla',
            'bafybeihdkta27txghweijwjotmorioat3bslnxjw2hxjt3q2kvquptaic4',
          ],
          quizzes: '',
        },
        {
          id: 7,
          lessontitle: 'Cold Storage and Vault Wallet Strategies',
          url: [
            'bafybeiaaxmjfgpzbo3zrwbzxxeovolq3kyl322g5vykrv3efds33maiei4',
            'bafybeib4nr6q3yhogy76ibpfv7hlqdgouombzbtqsq3dz3lszorrqae6qi',
          ],
          quizzes: '',
        },
        {
          id: 8,
          lessontitle: 'Smart Contract Safety and Transaction Simulation',
          url: [
            'bafybeibhjf5evv52whkukinpfuco74vgxgapyfn22nqt24pethuhdwsr6a',
            'bafybeiedr4zazepgxmvf55ovjzfsi3u7jomdesytugjo4wwshdmri7giuy',
          ],
          quizzes: '',
        },
        {
          id: 9,
          lessontitle: "Conclusion: You're Now Equipped For Battle",
          url: [
            'bafybeicv2gzdtkptxgiqiul3g65acaastedpx4ndagtxpygoi626lembae',
            'bafybeid4uztseihldxq7jhpi7ksdqvlpohwdb445y7rtir7dzr4ual2opq',
          ],
          quizzes: '',
        },
      ],
      prerequisites: ['Minted .safu domain'],
      objectives: [
        'Understand the major types of crypto scams and how attackers target users.',
        'Identify phishing tactics and social engineering tricks commonly used in crypto thefts.',
        'Secure wallets and private keys using best practices, tools, and storage methods.',
        'Respond effectively after a security incident, including damage control and potential recovery options.',
        'Develop a long-term security mindset that reduces risks while navigating Web3.',
      ],
      duration: '30',
    },
     {
      id: 1,
      title: 'Skyrocketing Your Small Business With AI',
      description:
        'Discover how to grow your small business with AI in this friendly, 20-minute course! You will learn to use AI tools like ChatGPT and Canva to boost marketing, save time, and increase sales.',
      longDescription:
        'Ready to supercharge your small business with Artificial Intelligence? Join our engaging, 20-minute course, “Skyrocketing Your Small Business with AI: A Friendly Guide to Smarter Marketing,” led by one of our synthetic AI avatars, Kai.\n  Designed for beginners and intermediates, this course demystifies AI, showing you how tools like ChatGPT, Canva, and Hootsuite can transform your marketing. Through eight bite-sized lessons, you’ll explore AI’s benefits, audit your current strategy, set SMART goals and select the right tools.\n With real-world examples (e.g., a bakery using AI for social posts), interactive quizzes, you’ll build a personalized AI marketing plan. Whether you want to automate tasks, personalize customer experiences, or boost ROI, this course equips you with the skills to succeed.',
      level: 'Beginner',
      category: 'Starter',
      url: 'https://ipfs.io/ipfs/bafkreihmqpmrfg6fxeiqarxsat6wwsvptegwynmuzveqnyfbcda7g2gliu',
      instructor: 'Tim',
      lessons: [
        {
          id: 0,
          lessontitle: 'What is AI and Why It Matters',
          url: [
            'bafybeifdbtbezbq6sjcvud5lj5pweexrlq7m4xkqeyvwgzxqa64u3psram',
            'bafybeigmqnk3ude7gwdmvekg37we5reockhlvzcrlxfukauint4wmqq53a',
          ],
          quizzes: '',
        },
        {
          id: 1,
          lessontitle: 'The Benefits of AI for Your Business',
          url: [
            'bafybeih2icrskkxvelkktvvoptvqk2lzchjrtd7uepy4zbcpbecrzisadu',
            'bafybeicd3iufd7cerjdnbrtfqrkynv7cunf4g5dc367ab2li4zz3qhpkka',
          ],
          quizzes: '',
        },
        {
          id: 2,
          lessontitle: 'Auditing Your Current Market Strategy',
          url: [
            'bafybeial4tnkfetkbredyxensxvhqdnkghebnf23uzeyluvvt5jp3uwkae',
            'bafybeihxhdaews4qhuj5xxfm662bwasnqyuzrsgznixnqr3sacoqjd2jku',
          ],
          quizzes: '',
        },
        {
          id: 3,
          lessontitle: 'Setting SMART AI Marketing Objectives',
          url: [
            'bafybeibexcz634brxze6ckdpytxtatxgwu3whza7nrokmkzgtrubeq4loi',
            'bafybeiasop2he27qzvcljcrkoeo7bqhlkoeggxtg3gr7uqtv7ynfxtbcpi',
          ],
          quizzes: '',
        },
        {
          id: 4,
          lessontitle: 'Choosing The Right AI Tools',
          url: [
            'bafybeigzgf7p7b5kqnfxk2clthm5sarmn2y2dybunx4q5amohkg32jaora',
            'bafybeifwy4i7acu2tf4claewel64qxsjuri4ya6qzy77uye4tjndgmrkkm',
          ],
          quizzes: '',
        },
        {
          id: 5,
          lessontitle: 'Overcoming AI Challenges',
          url: [
            'bafybeicbkk3jncinlzenrul5w2cgajvixcdfkrode4t7vdvkbypvav4x5u',
            'bafybeicxpqsjpxdzbz3kgxwkgvufvdivruzoupe5sg4vzok7qrbznndk4m',
          ],
          quizzes: '',
        },
        {
          id: 6,
          lessontitle: 'Implementing Your AI Strategy',
          url: [
            'bafybeifscypgfhzttmznznfnyz3re36ban4uaudtrm3qkx2imaf4atgj24',
            'bafybeifyv4p2nrrwyukgxottbmeoqdvvixjd5ywuq3bex3lszafwst4qfe',
          ],
          quizzes: '',
        },
        {
          id: 7,
          lessontitle: 'Measuring AI Success',
          url: [
            'bafybeibc3eqsneqqyc3w2rwkqtzeigd2yiasb7ikwpnsoje7ybt5awvudm',
            'bafybeib5ryy6wh5227nuyhngeq5b3qnhs7g7vyrs5cmsbx2vgdls5kfuz4',
          ],
          quizzes: '',
        },
        {
          id: 8,
          lessontitle: 'Final Class Project and Closing',
          url: [
            'bafybeifu4c33k6abt6trltoqezms3nlczo6gjtvkkqh7afbfxc5akoc3me',
            'bafybeibrwoqw24p4tqepvnr5y6ns6ba4a2j4rfifvnuujyzfk47yvoyk2m',
          ],
          quizzes: '',
        },
      ],
      prerequisites: ['Minted .safu domain'],
      objectives: [],
      duration: '30',
    }, */
   {
      id: 4,
      title: 'InfoFi Playbook Course: Winning the Game of Attention on Kaito',
      description:
        'This course gives you a step-by-step playbook to build smart presence, grow your Mindshare, and dominate the Kaito leaderboards — even with zero followers.',
      longDescription: `Welcome to the InfoFi Playbook, your complete course on mastering Kaito, the Web3 platform that turns attention into capital.\n
                        In this hands-on, conversation-style course, you’ll learn how to transform your tweets and replies into yield-bearing positions using InfoFi principles. Through real-world examples, guest tips, and practical lessons, you’ll uncover how to:\n
                        - Build smart presence with zero clout\n
                        - Earn YAP (Your Attention Power) from high-signal users\n
                        - Rank on Kaito project leaderboards through loyalty and insight\n
                        - Avoid slashing and stand out with original writing\n
                        - Use reply tactics, quote tweets, tools, and engagement tracking like a pro\n
                        Whether you’re a newcomer or a CT native, this course will help you win in the new era of attention-as-asset.`,
      level: 'Beginner',
      category: 'Starter',
      url: 'https://ipfs.io/ipfs/bafkreiagqltx3zh4nujyzbfi2z4sthhpmpwysqkagnd77a7svisyxmj5kq',
      instructor: 'Kayla',
      lessons: [
        {
          id: 0,
          lessontitle: 'Welcome To InfoFi: What’s this all about',
          url: [
            'bafybeighm4qtqllwa3uhdegczwi2htazmegxsl4rrjebn37p4s42vmc5i4',
            'bafybeibqs6grden5o4wo566icavw7cdw65idrezce77jvkf2hgtixqmh6m',
          ],
          quizzes: '',
        },
        {
          id: 1,
          lessontitle: 'Understanding InfoFi’s Core Metrics: YAP & Mindshare',
          url: [
            'bafybeif4uxq3lmroaekhmgh74qq7wbh5kcowctfg57zqhpnf336gxonzem',
            'bafybeie7kx3nrxl3ahytwtvjofb7zurc2spxkpfl2wggbs6t7zrusbfx6m',
          ],
          quizzes: '',
        },
        {
          id: 2,
          lessontitle: 'Building Presence With Zero Followers',
          url: [
            'bafybeic2e26ij7mrj4yccytdewd3ozvmyo6r762jfcayec6hrosmncavie',
            'bafybeicnftwuyctpsynaewbllzpeblfpeirqeofs5fykdnxzsxn2zqamoi',
          ],
          quizzes: '',
        },
        {
          id: 3,
          lessontitle: 'The Reply Guy Playbook',
          url: [
            'bafybeic4oyelaj25uohdqk7o2ybwj52okwa7snt5yze4j7fbjrf6yqmbc4',
            'bafybeibbg2rk6o7cwlrf2peyswoqja6w6lzuvgoaapo2wjkntiadjaay4q',
          ],
          quizzes: '',
        },
        {
          id: 4,
          lessontitle: 'Winning The Leaderboard Game',
          url: [
            'bafybeia4muwszp22zajrfeig7wssol7zthqb3lnxiky7me4myntr2enwse',
            'bafybeigerlh35xlmkiqdqqbbrkmpstttyaekf6cwbkle5k2i65jgzb5234',
          ],
          quizzes: '',
        },
        {
          id: 5,
          lessontitle: 'Don’t Farm. Build a Character',
          url: [
            'bafybeibwqlykyfxcr5xb3cg67kbjy76lir7m7e4ymg6mlfjs5rxvyla6oq',
            'bafybeiep7ef7hvq3abqn4gublrfjf45voj63zmmwbam3555svgdicfo6hi',
          ],
          quizzes: '',
        },
        {
          id: 6,
          lessontitle: 'Avoid Getting Slashed',
          url: [
            'bafybeiatyjiugqyfcgmvlqzrez4gl6inkfkhwxrgi3oz5qjigkjwd43z4i',
            'bafybeieovbhpandlzzupj6txkrj7f72fpagjas75rm733na5lifiyuinva',
          ],
          quizzes: '',
        },
        {
          id: 7,
          lessontitle: 'Final Words',
          url: [
            'bafybeidfvr265wisml5dhugnwxcudqiamj2f3gys6ojw7u3mjtmjplsljq',
            'bafybeidfcv2chjgqnx2sfxmnqp6ayb224eb6jutx7n3bjjmhvicgrndbsy',
          ],
          quizzes: '',
        },
      ],
      prerequisites: ['Minted .safu domain'],
      objectives: [
        'Explain the concept of InfoFi',
        'Differentiate between YAP and Mindshare',
        'Develop a smart reply and posting strategy',
        'Avoid common pitfalls and slashing behaviors',
        'Use tracking tools, reply lists, and timing techniques',
      ],
      duration: '30',
    },
  ]
  const factory = await ethers.getContractAt(
    'CourseFactory',
    '0xE796bc81c3F372237641998c24C755e710832bA9',
  )

  for (const course of courses) {
    const tx = await factory.addCourse(
      course.title,
      course.description,
      course.longDescription,
      course.instructor,
      course.objectives,
      course.prerequisites,
      course.category,
      course.level,
      course.url,
      course.lessons,
      course.duration,
    )
    await tx.wait()
    console.log(`Added new course ${tx.hash}`)
   }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
