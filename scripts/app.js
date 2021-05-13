new Vue ({
    el: "#app",
    data: {
        flags: ['de', 'en', 'es', 'fr', 'it'],
        textTosearch: "",
        tmdbApiKey: "d74e01c1c95f676efb7328c3ce5b6713",
        //2 liste separate:
        moviesList: [],
        tvSeriesList: [],
    },
    methods: {
        makeAxiosSearch (searchType) {
            const axiosOptions = {
                params: {
                    api_key: this.tmdbApiKey,
                    query: this.textTosearch,
                    language:"it-IT"
                }
            };
            //  axios.get("https://api.themoviedb.org/3/search/movie?api_key" + tmdbApiKey + "&query=" + this.textTosearch + "&language=it-IT" )
            axios.get("https://api.themoviedb.org/3/search/" + searchType, axiosOptions)
                .then ( (resp) => {
                    // per recuperare i dati json dati dal server mi aspetto di trovare l'array di tutti gli oggetti 
                    // resp tutta la risposta di axios ..il data quello che il server mi sta rispondendo in json .. e dentro al data c'è la chiave che mi interessa -> results 
                    if(searchType === "movie") {
                        this.moviesList = resp.data.results
                        
                    } else if (searchType === "tv") {

                        /* so che la serie tv al contrario dei movies hanno il campo name e original_name al posto di title e original_title
                        sapendo questo posso rinominare chiavi per renderle uguali e quelle dei movies ? */
                        this.tvSeriesList = resp.data.results.map((tvShow) => {

                            //mappatura dei campi 
                            tvShow.original_title = tvShow.original_name
                            tvShow.title = tvShow.name 
                            
                            return tvShow
                        })
                    }
                    
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

            //concat()?? 2 array uniti insieme 


        }
    },
    computed: {
        fullList () {
            return [...this.moviesList, ...this.tvSeriesList].map(item => {
                let flag
                if (this.flags.includes(item.original_language)) {
                    flag = `img/${item.original_language}.png`
                } else {
                    flag = 'img/default.png'
                }
                let poster = false;
                if (item.poster_path) {
                    poster = `https://image.tmdb.org/t/p/w500${item.poster_path}`
                }
                return {
                    ...item,
                    flag: flag,
                    poster_path: poster,
                    vote_average: Math.round(item.vote_average / 2)
                }
            })
        }
    }
})