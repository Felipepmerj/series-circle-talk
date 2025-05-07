
import { Series, User, SeriesReview, WatchlistItem, FeedItem } from "../types/Series";

// Mock series data
export const mockSeries: Series[] = [
  {
    id: 1396,
    name: "Breaking Bad",
    original_name: "Breaking Bad",
    overview: "Um professor de química do ensino médio com câncer terminal se junta a um ex-aluno para produzir e vender metanfetamina.",
    poster_path: "/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
    backdrop_path: "/tsRy63Mu5cu8etL1X7ZLyf7UP1M.jpg",
    first_air_date: "2008-01-20",
    genres: [{ id: 18, name: "Drama" }],
    vote_average: 8.5,
  },
  {
    id: 1399,
    name: "Game of Thrones",
    original_name: "Game of Thrones",
    overview: "Sete famílias nobres lutam pelo controle da mítica terra de Westeros. O conflito entre as casas Stark, Lannister, Baratheon e Targaryen.",
    poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
    backdrop_path: "/suopoADq0k8YZr4dQXcU6pToj6s.jpg",
    first_air_date: "2011-04-17",
    genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }, { id: 18, name: "Drama" }],
    vote_average: 8.3,
  },
  {
    id: 66732,
    name: "Stranger Things",
    original_name: "Stranger Things",
    overview: "Quando um garoto desaparece, a cidadezinha de Hawkins descobre um mistério envolvendo experimentos secretos, forças sobrenaturais e uma garotinha estranha.",
    poster_path: "/49WJfeN0moxb9IPfGn8AIqMGskD.jpg",
    backdrop_path: "/56v2KjBlU4XaOv9rVYEQypROD7P.jpg",
    first_air_date: "2016-07-15",
    genres: [{ id: 18, name: "Drama" }, { id: 10765, name: "Sci-Fi & Fantasy" }],
    vote_average: 8.6,
  },
  {
    id: 1668,
    name: "Friends",
    original_name: "Friends",
    overview: "Seis amigos, três homens e três mulheres, enfrentam a vida e os amores em Nova York e adoram passar o tempo livre na cafeteria Central Perk.",
    poster_path: "/f496cm9enuEsZkSPzCwnTESEK5s.jpg",
    backdrop_path: "/l0qVZIpXtIo7km9u5Yqh0nKPOr5.jpg",
    first_air_date: "1994-09-22",
    genres: [{ id: 35, name: "Comédia" }],
    vote_average: 8.4,
  },
  {
    id: 71446,
    name: "La Casa de Papel",
    original_name: "La Casa de Papel",
    overview: "Oito ladrões fazem reféns e se trancam na Casa da Moeda da Espanha com o objetivo de realizar o maior roubo da história.",
    poster_path: "/yVUAfmxbB8gCGhq2NUohXPLvNs6.jpg",
    backdrop_path: "/piuRhGiQBMWbQ5LK9sxsITZkm9E.jpg",
    first_air_date: "2017-05-02",
    genres: [{ id: 80, name: "Crime" }, { id: 18, name: "Drama" }],
    vote_average: 8.3,
  }
];

// Mock users
export const mockUsers: User[] = [
  {
    id: "user1",
    name: "Maria Silva",
    profilePic: "https://randomuser.me/api/portraits/women/44.jpg",
    watchedSeries: [
      {
        id: "rev1",
        userId: "user1",
        seriesId: 1396,
        rating: 9,
        comment: "Melhor série que já assisti! A atuação do Bryan Cranston é perfeita.",
        watchedOn: "2022-05-10",
        createdAt: "2022-05-15T14:48:00.000Z"
      },
      {
        id: "rev2",
        userId: "user1",
        seriesId: 1399,
        rating: 7,
        comment: "Gostei bastante, mas o final foi decepcionante.",
        watchedOn: "2022-01-20",
        createdAt: "2022-01-25T10:30:00.000Z"
      }
    ],
    watchlist: [
      {
        id: "watch1",
        userId: "user1",
        seriesId: 66732,
        note: "Todo mundo recomendou, preciso assistir!",
        addedAt: "2022-06-01T09:15:00.000Z"
      }
    ]
  },
  {
    id: "user2",
    name: "João Costa",
    profilePic: "https://randomuser.me/api/portraits/men/32.jpg",
    watchedSeries: [
      {
        id: "rev3",
        userId: "user2",
        seriesId: 1668,
        rating: 10,
        comment: "Clássico absoluto! Assisto uma vez por ano.",
        watchedOn: "2021-12-15",
        createdAt: "2021-12-20T19:22:00.000Z"
      },
      {
        id: "rev4",
        userId: "user2",
        seriesId: 71446,
        rating: 8,
        comment: "Muito criativo e com personagens cativantes.",
        watchedOn: "2022-04-05",
        createdAt: "2022-04-10T21:17:00.000Z"
      }
    ],
    watchlist: [
      {
        id: "watch2",
        userId: "user2",
        seriesId: 1396,
        note: "Sempre ouço que é a melhor série de todas, preciso conferir.",
        addedAt: "2022-03-20T15:40:00.000Z"
      }
    ]
  },
  {
    id: "user3",
    name: "Ana Oliveira",
    profilePic: "https://randomuser.me/api/portraits/women/23.jpg",
    watchedSeries: [
      {
        id: "rev5",
        userId: "user3",
        seriesId: 66732,
        rating: 9,
        comment: "Muito nostálgica! Me lembra minha infância nos anos 80.",
        watchedOn: "2022-02-28",
        createdAt: "2022-03-02T11:05:00.000Z"
      },
      {
        id: "rev6",
        userId: "user3",
        seriesId: 1396,
        rating: 10,
        comment: "Obra-prima! Cada temporada melhor que a anterior.",
        watchedOn: "2021-11-10",
        createdAt: "2021-11-15T18:23:00.000Z"
      }
    ],
    watchlist: [
      {
        id: "watch3",
        userId: "user3",
        seriesId: 1399,
        note: "Quero assistir antes que me estraguem o final!",
        addedAt: "2022-01-05T08:50:00.000Z"
      }
    ]
  }
];

// Mock feed items
export const mockFeed: FeedItem[] = [
  {
    id: "feed1",
    type: "review",
    userId: "user1",
    seriesId: 1396,
    reviewId: "rev1",
    createdAt: "2022-05-15T14:48:00.000Z"
  },
  {
    id: "feed2",
    type: "added-to-watchlist",
    userId: "user1",
    seriesId: 66732,
    watchlistItemId: "watch1",
    createdAt: "2022-06-01T09:15:00.000Z"
  },
  {
    id: "feed3",
    type: "review",
    userId: "user2",
    seriesId: 71446,
    reviewId: "rev4",
    createdAt: "2022-04-10T21:17:00.000Z"
  },
  {
    id: "feed4",
    type: "added-to-watchlist",
    userId: "user2",
    seriesId: 1396,
    watchlistItemId: "watch2",
    createdAt: "2022-03-20T15:40:00.000Z"
  },
  {
    id: "feed5",
    type: "review",
    userId: "user3",
    seriesId: 66732,
    reviewId: "rev5",
    createdAt: "2022-03-02T11:05:00.000Z"
  }
];
