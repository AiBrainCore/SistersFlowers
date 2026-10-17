export type Product = {
  slug: string;
  price: number;
  image: string;
  accent: string;
  names: { en: string; vi: string };
  tags: { en: string; vi: string };
  blurb: { en: string; vi: string };
  story: { en: string; vi: string };
};

export const products: Product[] = [
  {
    slug: "tone-noi",
    price: 750000,
    image: "/bouquets/shown/w-01.jpg",
    accent: "rose",
    names: { en: "Celebration garden wrap", vi: "Bó vườn lễ hội" },
    tags: { en: "Garden wrap bouquet", vi: "Bó garden gói giấy" },
    blurb: {
      en: "Pink hydrangea, alstroemeria and soft sprays in mint paper.",
      vi: "Tú cầu hồng, lily Peru và hoa phụ trong giấy mint.",
    },
    story: {
      en: "A finished studio wrap — ribboned and ready to hand over as a complete bouquet.",
      vi: "Bó hoa gói sẵn tại studio — nơ đẹp, trao tay như một món quà hoàn chỉnh.",
    },
  },
  {
    slug: "mix-keo-hong",
    price: 890000,
    image: "/bouquets/shown/w-02.jpg",
    accent: "blush",
    names: { en: "Pink glue mix", vi: "Mix keo hồng" },
    tags: { en: "Pink mix bouquet", vi: "Bó mix hồng" },
    blurb: {
      en: "Round pink roses, satin bow, the everyday viral wrap.",
      vi: "Hồng tròn, nơ satin — kiểu bó hay lên clip.",
    },
    story: {
      en: "A full round bouquet of pink roses, wrapped and bowed in the studio. This is how the shop actually makes gifts.",
      vi: "Bó hồng tròn đầy, gói và nơ tại tiệm. Đúng cách Sisters tặng hoa.",
    },
  },
  {
    slug: "tot-nghiep",
    price: 450000,
    image: "/bouquets/shown/w-03.jpg",
    accent: "blush",
    names: { en: "Graduation mix", vi: "Hoa tốt nghiệp" },
    tags: { en: "Mix bouquet", vi: "Bó mix" },
    blurb: {
      en: "Pastel mix — graduation, surprise, same-day gift.",
      vi: "Mix pastel — tốt nghiệp, bất ngờ, giao trong ngày.",
    },
    story: {
      en: "A colourful wrapped mix. Gerbera, spray roses, fillers — always a bouquet, never a single stem.",
      vi: "Bó mix nhiều màu. Đồng tiền, hồng spray, hoa phụ — luôn là một bó, không bán cành.",
    },
  },
  {
    slug: "hong-do-qua",
    price: 990000,
    image: "/bouquets/shown/w-04.jpg",
    accent: "blush",
    names: { en: "Pink tulip wrap", vi: "Bó tulip hồng" },
    tags: { en: "Tulip bouquet", vi: "Bó tulip" },
    blurb: {
      en: "Fresh pink tulips in mint paper — a clear, joyful studio wrap.",
      vi: "Tulip hồng tươi trong giấy mint — bó rõ nét, vui từ studio.",
    },
    story: {
      en: "A full tulip bouquet wrapped in the studio. What you see is what we gift.",
      vi: "Bó tulip đầy gói tại studio. Những gì bạn thấy là món quà trao tay.",
    },
  },
  {
    slug: "hong-tron",
    price: 650000,
    image: "/bouquets/shown/w-05.jpg",
    accent: "blush",
    names: { en: "Round blush", vi: "Hồng tròn 1m" },
    tags: { en: "Round bouquet", vi: "Bó tròn" },
    blurb: {
      en: "Soft round bouquet, kraft wrap, easy to carry.",
      vi: "Bó tròn dịu, giấy kraft, cầm vừa tay.",
    },
    story: {
      en: "A compact round bouquet — still a full wrap, not loose flowers.",
      vi: "Bó tròn gọn — vẫn là bó hoàn chỉnh, không phải hoa rời.",
    },
  },
  {
    slug: "cau-hon",
    price: 1250000,
    image: "/bouquets/shown/w-06.jpg",
    accent: "blush",
    names: { en: "Pink rose eucalyptus", vi: "Hồng phấn & bạch đàn" },
    tags: { en: "Rose bouquet", vi: "Bó hồng" },
    blurb: {
      en: "Soft pink roses with eucalyptus in dusty-rose paper.",
      vi: "Hồng phấn và bạch đàn trong giấy hồng đất.",
    },
    story: {
      en: "A complete rose bouquet for romance and proposals — wrapped as one gift.",
      vi: "Bó hồng hoàn chỉnh cho lãng mạn và cầu hôn — gói thành một món quà.",
    },
  },
  {
    slug: "mix-sang",
    price: 550000,
    image: "/bouquets/shown/w-07.jpg",
    accent: "blush",
    names: { en: "Soft rose wrap", vi: "Bó hồng dịu" },
    tags: { en: "Rose bouquet", vi: "Bó hồng" },
    blurb: {
      en: "Peach, cream and dusty-pink roses in soft pink paper.",
      vi: "Hồng đào, kem và hồng phấn trong giấy hồng dịu.",
    },
    story: {
      en: "A romantic rose wrap from the studio table — one complete bouquet.",
      vi: "Bó hồng lãng mạn từ bàn gói studio — một bó hoàn chỉnh.",
    },
  },
  {
    slug: "hong-do-mau-don",
    price: 1590000,
    image: "/bouquets/shown/w-08.jpg",
    accent: "rose",
    names: { en: "Peony-style reds", vi: "Hồng đỏ kiểu mẫu đơn" },
    tags: { en: "Premium rose bouquet", vi: "Bó hồng đỏ premium" },
    blurb: {
      en: "Dense red roses, white paper, the shop’s favourite full bouquet.",
      vi: "Hồng đỏ dày, giấy trắng — bó full khách thích nhất.",
    },
    story: {
      en: "Packed roses in a studio wrap — one finished bouquet, ready to gift.",
      vi: "Hồng xếp dày, gói studio — một bó hoàn chỉnh, sẵn sàng tặng.",
    },
  },
  {
    slug: "valentine-mix",
    price: 890000,
    image: "/bouquets/shown/w-09.jpg",
    accent: "blush",
    names: { en: "Pastel garden mix", vi: "Mix vườn pastel" },
    tags: { en: "Garden mix bouquet", vi: "Bó garden mix" },
    blurb: {
      en: "Pastel carnations, eucalyptus and bright accents in kraft paper.",
      vi: "Cẩm chướng pastel, bạch đàn và điểm nhấn trong giấy kraft.",
    },
    story: {
      en: "A cheerful garden wrap — colour chosen as one bouquet, not stem by stem.",
      vi: "Bó vườn vui — chọn màu cả bó, không chọn từng cành.",
    },
  },
  {
    slug: "no-hong",
    price: 720000,
    image: "/bouquets/shown/w-10.jpg",
    accent: "blush",
    names: { en: "Pink ribbon", vi: "Nơ hồng" },
    tags: { en: "Ribbon wrap bouquet", vi: "Bó nơ dài" },
    blurb: {
      en: "Soft mix with a long studio ribbon.",
      vi: "Mix dịu với nơ dài.",
    },
    story: {
      en: "The ribbon is part of the bouquet. Finished in the shop, same language as the social clips.",
      vi: "Nơ là một phần của bó. Gói xong tại tiệm, cùng vibe clip.",
    },
  },
  {
    slug: "hong-do-giay-trang",
    price: 1150000,
    image: "/bouquets/shown/w-11.jpg",
    accent: "rose",
    names: { en: "Orange rose wrap", vi: "Bó hồng cam" },
    tags: { en: "Rose bouquet", vi: "Bó hồng" },
    blurb: {
      en: "Vibrant orange spray roses in sky-blue studio paper.",
      vi: "Hồng cam rực trong giấy xanh studio.",
    },
    story: {
      en: "A bright full bouquet — always wrapped as one piece for gifting or hotel delivery.",
      vi: "Bó rực rỡ — luôn gói thành một món để tặng hoặc giao khách sạn.",
    },
  },
  {
    slug: "lily-mix",
    price: 680000,
    image: "/bouquets/shown/w-12.jpg",
    accent: "ivory",
    names: { en: "Lily mix", vi: "Mix lily" },
    tags: { en: "Mix bouquet", vi: "Bó mix" },
    blurb: {
      en: "Lilies and garden mix in kraft paper.",
      vi: "Lily và mix vườn, giấy kraft.",
    },
    story: {
      en: "A taller wrapped bouquet. Mixed heads, one gift.",
      vi: "Bó cao hơn một chút. Nhiều loại hoa, một món quà.",
    },
  },
  {
    slug: "hong-xanh",
    price: 620000,
    image: "/bouquets/shown/w-13.jpg",
    accent: "sage",
    names: { en: "Pink & greens", vi: "Hồng lá xanh" },
    tags: { en: "Garden bouquet", vi: "Bó garden" },
    blurb: {
      en: "Soft pinks with plenty of greens — still one bouquet.",
      vi: "Hồng nhạt nhiều lá — vẫn là một bó.",
    },
    story: {
      en: "Garden wrap from the shop floor. No single-stem sales.",
      vi: "Bó garden làm tại studio — tươi và sẵn sàng tặng.",
    },
  },
  {
    slug: "garden-mix",
    price: 790000,
    image: "/bouquets/shown/w-14.jpg",
    accent: "sage",
    names: { en: "Garden mix", vi: "Garden mix" },
    tags: { en: "Garden bouquet", vi: "Bó garden mix" },
    blurb: {
      en: "The colourful garden wrap from the clips.",
      vi: "Bó garden nhiều màu như trên clip.",
    },
    story: {
      en: "Mixed seasonal flowers, studio paper wrap, one complete bouquet.",
      vi: "Hoa mix theo ngày, giấy gói studio, một bó hoàn chỉnh.",
    },
  },
  {
    slug: "mix-giay-hong",
    price: 850000,
    image: "/bouquets/shown/w-15.jpg",
    accent: "blush",
    names: { en: "Pink paper mix", vi: "Mix giấy hồng" },
    tags: { en: "Wrapped bouquet", vi: "Bó gói giấy hồng" },
    blurb: {
      en: "Full mix in pink wrapping paper.",
      vi: "Mix đầy trong giấy hồng.",
    },
    story: {
      en: "Paper, ribbon, mixed roses — the shop’s default language.",
      vi: "Giấy, nơ, hồng mix — đúng ngôn ngữ tiệm.",
    },
  },
  {
    slug: "hong-do-ngoai",
    price: 1050000,
    image: "/bouquets/shown/w-16.jpg",
    accent: "rose",
    names: { en: "Doorway reds", vi: "Hồng đỏ trước tiệm" },
    tags: { en: "Red rose bouquet", vi: "Bó hồng đỏ" },
    blurb: {
      en: "Red roses, photographed leaving the shop.",
      vi: "Hồng đỏ, chụp lúc ra khỏi tiệm.",
    },
    story: {
      en: "A finished bouquet at the door — how local delivery actually looks.",
      vi: "Bó xong đứng trước cửa — đúng dáng giao hoa.",
    },
  },
  {
    slug: "no-dai-hong",
    price: 820000,
    image: "/bouquets/shown/w-17.jpg",
    accent: "blush",
    names: { en: "Long pink bow", vi: "Nơ hồng dài" },
    tags: { en: "Ribbon bouquet", vi: "Bó nơ dài" },
    blurb: {
      en: "Pale roses, oversized bow — very shop, very wrap.",
      vi: "Hồng nhạt, nơ to — đúng tiệm, đúng gói.",
    },
    story: {
      en: "The bow is half the bouquet. Wrapped as one gift, never sold as stems.",
      vi: "Nơ chiếm nửa bó. Gói thành một món, không bán cành.",
    },
  },
  {
    slug: "sinh-nhat-mix",
    price: 590000,
    image: "/bouquets/shown/w-18.jpg",
    accent: "blush",
    names: { en: "Birthday mix", vi: "Mix sinh nhật" },
    tags: { en: "Occasion bouquet", vi: "Bó sinh nhật" },
    blurb: {
      en: "Soft mix for birthdays — round, wrapped, ready.",
      vi: "Mix dịu sinh nhật — tròn, gói, sẵn.",
    },
    story: {
      en: "A birthday bouquet from the shop’s real wrapping table.",
      vi: "Bó sinh nhật từ bàn gói thật của tiệm.",
    },
  },
  {
    slug: "mix-cam-dao",
    price: 640000,
    image: "/bouquets/shown/w-19.jpg",
    accent: "blush",
    names: { en: "Peach mix", vi: "Mix cam đào" },
    tags: { en: "Mix bouquet", vi: "Bó mix" },
    blurb: {
      en: "Peach and cream heads in one wrap.",
      vi: "Hoa cam đào và kem trong một bó.",
    },
    story: {
      en: "Seasonal mix bouquet. Colour is chosen as a whole, not stem by stem.",
      vi: "Bó mix theo mùa. Chọn màu cả bó, không chọn từng cành.",
    },
  },
  {
    slug: "mix-vang",
    price: 580000,
    image: "/bouquets/shown/w-20.jpg",
    accent: "ivory",
    names: { en: "Sunshine mix", vi: "Mix vàng" },
    tags: { en: "Bright bouquet", vi: "Bó tươi" },
    blurb: {
      en: "Yellow and orange mix — cheerful wrap.",
      vi: "Mix vàng cam — bó vui.",
    },
    story: {
      en: "A bright wrapped bouquet for congratulations and visits.",
      vi: "Bó tươi gói giấy, tặng chúc mừng và thăm.",
    },
  },
  {
    slug: "hong-tra",
    price: 920000,
    image: "/bouquets/shown/w-21.jpg",
    accent: "blush",
    names: { en: "Tea roses", vi: "Hồng trà" },
    tags: { en: "Rose bouquet", vi: "Bó hồng trà" },
    blurb: {
      en: "Tea-rose bouquet, pink paper, two-person studio shot.",
      vi: "Bó hồng trà, giấy hồng, chụp trong tiệm.",
    },
    story: {
      en: "Soft tea roses wrapped as a full bouquet — the shop’s gentle gift.",
      vi: "Hồng trà gói thành bó đầy — món dịu của tiệm.",
    },
  },
  {
    slug: "mix-gerbera",
    price: 520000,
    image: "/bouquets/shown/w-22.jpg",
    accent: "blush",
    names: { en: "Gerbera mix", vi: "Mix đồng tiền" },
    tags: { en: "Mix bouquet", vi: "Bó mix" },
    blurb: {
      en: "Gerbera and spray roses, pink wrap.",
      vi: "Đồng tiền và hồng spray, giấy hồng.",
    },
    story: {
      en: "A friendly mix bouquet. Always sold whole.",
      vi: "Bó mix dễ tặng. Luôn bán nguyên bó.",
    },
  },
  {
    slug: "hong-nhat-day",
    price: 1350000,
    image: "/bouquets/shown/w-23.jpg",
    accent: "blush",
    names: { en: "Full pink roses", vi: "Hồng nhạt đầy" },
    tags: { en: "Premium rose bouquet", vi: "Bó hồng premium" },
    blurb: {
      en: "A dense pink rose bouquet — the big wrap.",
      vi: "Bó hồng nhạt dày — gói lớn.",
    },
    story: {
      en: "Packed pink roses in a studio wrap — one finished bouquet.",
      vi: "Hồng nhạt xếp dày, gói studio — một bó hoàn chỉnh.",
    },
  },
  {
    slug: "garden-vuon",
    price: 610000,
    image: "/bouquets/shown/w-24.jpg",
    accent: "sage",
    names: { en: "Garden from the yard", vi: "Garden mix vườn" },
    tags: { en: "Garden bouquet", vi: "Bó garden" },
    blurb: {
      en: "Mixed garden bouquet, the colourful daily wrap.",
      vi: "Bó garden mix, gói nhiều màu mỗi ngày.",
    },
    story: {
      en: "Da Lat colour in one wrap. The catalogue is bouquets only.",
      vi: "Màu Đà Lạt trong một bó. Catalogue chỉ có bó hoa.",
    },
  },
];

export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function formatVnd(amount: number, locale: "en" | "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}
