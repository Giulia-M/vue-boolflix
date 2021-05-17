new Vue({
    el: "#app",
    data: {
        flags: {
            en: 'us'
        },
        textTosearch: "",
        tmdbApiKey: "d74e01c1c95f676efb7328c3ce5b6713",
        //2 liste separate:
        moviesList: [],
        tvSeriesList: [],
        //generi film
        movieGenres: [],
        tvGenres: [],
        genreFilter: ''
    },
    //quando l'app è pronta (hook mounted) carico la lista dei generi dei film e delle serie salvandoli nelle rispettive variabili in data 
    mounted() {
        this.loadGenres('movie')
        this.loadGenres('tv')
    },
    methods: {
        makeAxiosSearch(searchType) {
            const axiosOptions = {
                params: {
                    api_key: this.tmdbApiKey,
                    query: this.textTosearch,
                    language: "it-IT"
                }
            };
            //  axios.get("https://api.themoviedb.org/3/search/  movie?api_key" + tmdbApiKey + "&query=" + this.textTosearch + "&language=it-IT" )
            axios.get("https://api.themoviedb.org/3/search/" + searchType, axiosOptions)
                .then((resp) => {
                    // per recuperare i dati json dati dal server mi aspetto di trovare l'array di tutti gli oggetti 
                    // resp tutta la risposta di axios ..il data quello che il server mi sta rispondendo in json .. e dentro al data c'è la chiave che mi interessa -> results 
                    if (searchType === "movie") {
                        this.moviesList = resp.data.results
                    } else if (searchType === "tv") {
                        /* so che la serie tv al contrario dei movies hanno il campo name e original_name al posto di title e original_title
                        sapendo questo posso rinominare chiavi per renderle uguali e quelle dei movies ? */
                        this.tvSeriesList = resp.data.results.map((tvShow) => {
                            //mappatura dei campi 
                            tvShow.original_title = tvShow.original_name
                            tvShow.title = tvShow.name

                            tvShow.isSerie = true

                            return tvShow
                        })
                    }
                    // console.log(resp.data.results)

                })
        },
        doSearch() {
            /*- prendere il testo da ricercare
                -this.textTosearch
             - dobbiamo comporre la query string da  usare durante la chiamata alle api di TMDB 
             - eseguo la chiamata all'endopoin che mi serve, inviando la query string appena creata 
             - nel then della risposta andrò a salvare i dati che ricevo in una variabile locale 
             */
            this.makeAxiosSearch("movie");
            this.makeAxiosSearch("tv");
           
        },
        callCast(movie) {
            //son partita dall'evento mouseenter ="callCast(movie)"
            //se abbiamo fatto già la prima chiamata allora non ripetere la seconda chiamata sulla stessa card 

            if (movie.castList) {
                return;
            }
            const axiosOptions = {
                params: {
                    api_key: this.tmdbApiKey,
                    language: "it-IT"
                }
            };
            const type = movie.isSerie ? 'tv' : 'movie'
            //axios richiede con il metodo get dei dati 
            //GET /movie/{movie_id}/credits
            //GET /tv/{movie_id}/credits
            // .id è la chiave dell'oggetto movie 
            axios.get(`https://api.themoviedb.org/3/${type}/${movie.id}/credits`, axiosOptions)

                .then((resp) => {
                    // resp.data.cast è un array lo prendo, da response 
                    //slice mi escono i primi 5 risultati 
                    //movie.cast= è un array di stringhe (cioè "original_name"), original_name è la chiave dell'oggetto dell'array di resp.data.cast 
                    this.$set(movie, "castList", resp.data.cast.slice(0, 5).map(item => item.original_name))
                })
        },
        //faccio la chiamata dei generi 
        //il type viene passato tramite il mounted poi nell fullList aggiungo nel return genres
        loadGenres(type) {
            const axiosOptions = {
                params: {
                    api_key: this.tmdbApiKey,
                    language: "it-IT"
                }
            };

            // GET /genre/movie/list
            // GET /genre/tv/list
            axios.get(`https://api.themoviedb.org/3/genre/${type}/list`, axiosOptions)
                .then((resp) => {
                    //il type è === "movie", mi salva la risposta nell'array this.movieGenres
                    if (type === "movie") {
                        this.movieGenres = resp.data.genres
                    } else {
                        this.tvGenres = resp.data.genres
                    }
                })
        },

        getImgSrc(movie) {
            if(movie.poster_path) {
                return `https://image.tmdb.org/t/p/w342${movie.poster_path}`
            } else {
                return "img/No_cover.jpg"
            }
        }
    },
    //si aggiorna solo quand una variabile che usa viene aggiornata
    computed: {
        fullList() {
            
            return this.moviesList.concat(this.tvSeriesList).map(item => {
                
                item.country = this.flags[item.original_language] || item.original_language,
                
                item.vote = Math.round(item.vote_average / 2),
                 //creo una chiave genres che è un array dei nomi dei generi del singolo item (film o serie) e lo faccio con un map sulla chiave genre_ids che è un array degli id dei generi del singolo item. Nel Map cerco l'oggetto del genere (id +nome) nelle variabili tvGenres se è una serie tv , e in movieGenres se è un film e restituisco il name in modo da avere l'array dei nomi dei generi 
                item.typeGenres = item.genre_ids.map((id) => {
                    const genres = item.isSerie ? this.tvGenres : this.movieGenres
                   
                    const genresVar= genres.find(genre => genre.id === id)
                    
                    return genresVar

                }).filter(g => g !== undefined)
                .map(g => g.name)
                return item
                

            }).sort((a, b) => {
                if ( a.original_title.toLowerCase() < b.original_title.toLowerCase() ) {
                    return -1;
                }
                if ( a.original_title.toLowerCase() > b.original_title.toLowerCase() ) {
                    return 1;
                }
                return 0;
            }).filter((item) => {
                //se genreFilter è vuoto restituisco semrpe true quindi mostro tutti gli eleemnti 
                    if (!this.genreFilter) {
                        return true
                    }
                    //altrimenti se genereFilter ha un id verifico che l'item includa qst id 
                    return item.genre_ids.includes(this.genreFilter) 
                })
        },
        
    }
})