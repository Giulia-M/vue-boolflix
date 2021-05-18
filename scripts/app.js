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
        genreFilter: '',
        loading: false,
        imagesList: [
            "img/film1.jpeg",
            "img/alice.jpg",
            "img/film3.jpg",
            "img/film4.jpeg",
            "img/film5.jpeg",
            "img/film6.jpg",

        ],
        activeImg: 0,
    },
    //quando l'app è pronta (hook mounted) carico la lista dei generi dei film e delle serie salvandoli nelle rispettive variabili in data 
    mounted() {
        this.loadGenres('movie')
        this.loadGenres('tv')

        const elementHtml= document.querySelector(".sliderWrap")
        elementHtml.focus()
    },
    methods: {
        changeImg(direction){

            let newIndex = this.activeImg + direction;
            
            if (newIndex < 0) {

                newIndex = this.imagesList.length - 1;

            } else if (newIndex > (this.imagesList.length - 1 )) {
                newIndex = 0;
            }

            this.activeImg = newIndex;

        },
        onDotClick(clickedIndex) {
            this.activeImg = clickedIndex;
        },
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
            this.loading = true

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

                        //Vue.set(object, propertyName, value) method:
                    this.$set(movie, "castList", resp.data.cast.slice(0, 5).map(item => item.original_name))

                    this.loading = false
                    
                   
                    
                    
                });
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
            if (movie.poster_path) {
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

                item.country = this.flags[item.original_language] || item.original_language

                item.vote = Math.round(item.vote_average / 2)

                //creo una chiave 'item.typeGenres' -> è un array dei generi (film o serie) e lo faccio con un map sulla chiave 'genre_ids' -> è un array degli id dei generi del singolo item. 

                /**
                 * typeGenres: Array(2)
                    0: "Documentario"
                    1: "Musica"
                 */
                item.typeGenres = item.genre_ids.map((id) => {
                    const genres = item.isSerie ? this.tvGenres : this.movieGenres

                    const genresVar = genres.find(genre => genre.id === id)

                    return genresVar
                    /*Object
                        id: (...)
                        name: (...)
                    */

                }).filter(genreFound => genreFound !== undefined)
                    .map(genreResult => genreResult.name)


                return item
                /** 
                 * Object
                    adult: (...)
                    backdrop_path: (...)
                    country: "us"
                    genre_ids: (...)
                    id: (...)
                    original_language: (...)
                    original_title: (...)
                    overview: (...)
                    popularity: (...)
                    poster_path: (...)
                    release_date: (...)
                    title: (...)
                    typeGenres: (2) ["Documentario", "Musica"]
                    video: (...)
                    vote: 4
                    vote_average: (...)
                    vote_count: (...)
                */


            }).sort((a, b) => {
                if (a.original_title.toLowerCase() < b.original_title.toLowerCase()) {
                    return -1;
                }
                if (a.original_title.toLowerCase() > b.original_title.toLowerCase()) {
                    return 1;
                }
                return 0;
            }).filter((item) => {
                //se genreFilter è vuoto restituisco semrpe true quindi mostro tutti gli eleemnti 
                if (!this.genreFilter) {
                    return true
                }
                //altrimenti se genereFilter ha un id verifico che l'id corrisponda al genere selezionato dall'utente 
                return item.genre_ids.includes(this.genreFilter)
            })
        },
        //serve per non avere nella select i generi doppi dei film e delle serie tv 
        genresFilteredByCategory() {
            //il findIndex trova il primo elemento dell'array che soddisfa la condizione della sua funzione
            //ti torna l'indice dell'elemento che ha quello id vuol dire che è la prima volta che trovo quell'elemento e quindi lo include nell'array risultante del filtro altrimenti non lo include 

            /**
             * currentGenre -> Object -> id: (...) name: (...)
             * arrayGenres -> Array(19) -> 0:id: (...) name: (...) 
             * index: 0
             * */ 
            return this.movieGenres.concat(this.tvGenres).filter((currentGenre, index, arrayGenres) => {

                /**
                 * index 0 ===  array(19)
                 */
                return index === arrayGenres.findIndex((indice) => indice.id === currentGenre.id)
                //ordinare in ordine alfabetico i generi
            }).sort((a, b) => {
                if (a.name.toLowerCase() < b.name.toLowerCase()) {
                    return -1;
                }
                if (a.name.toLowerCase() > b.name.toLowerCase()) {
                    return 1;
                }
                return 0;
            })
        }

    }
})