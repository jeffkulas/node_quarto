
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Quarto'})
};

/*
 * game page
 */
exports.game = function(req, res){
  res.render('game', { title: 'Quarto' })
};