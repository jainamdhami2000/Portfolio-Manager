//jshint esversion:8

const express = require('express');
const sanitize = require('mongo-sanitize');
const searchRouter = express.Router();
const master = require('../model/master');
const nseModel = require('../model/nsescript');
const bseModel = require('../model/bsescript');

searchRouter.get('/report1', isLoggedIn, function(req, res) {
  var query = {};
  param = {};
  query.$and = [];
  var from = new Date();
  var dd = String(from.getDate()).padStart(2, '0');
  var mm = String(from.getMonth()).padStart(2, '0'); //January is 0!
  var yyyy = from.getFullYear();
  from = new Date(yyyy, mm, dd);
  // var to = new Date(from.getTime() - (24 * 60 * 60 * 1000) * 8);
  var to = from;
  param.date = from;
  param.enddate = from;
  query.$and.push({
    date: {
      $lte: from,
      $gte: to
    }
  });
  mm = String(from.getMonth() + 1).padStart(2, '0');
  from = new Date(yyyy, mm, dd);
  to = from;
  query.$and.push({
    company_name: {
      $in: req.user.scripts
    }
  });
  nseModel.find(query, async (err, nsedata) => {
    await bseModel.find(query, async (err, bsedata) => {
      var result = [];
      var data = {};
      for (var i = 0; i < nsedata.length; i++) {
        for (var j = 0; j < bsedata.length; j++) {
          if (bsedata[j].company_name == nsedata[i].company_name && String(bsedata[j].date) == String(nsedata[i].date)) {
            data = {
              name_of_security: nsedata[i].name_of_security,
              nse_quantity_traded: nsedata[i].quantity_traded,
              nse_deliverable_quantity: nsedata[i].deliverable_quantity,
              nse_percentage_of_deliverable_quantity_to_traded_quantity: nsedata[i].percentage_of_deliverable_quantity_to_traded_quantity,
              nse_close: nsedata[i].close,
              nse_date: nsedata[i].date,
              company_name: nsedata[i].company_name,
              bse_delivery_quantity: bsedata[j].delivery_quantity,
              bse_day_volume: bsedata[j].day_volume,
              bse_delv_per: bsedata[j].delv_per,
            };
            await result.push(data);
          }
        }
      }
      console.log(result);
      var final = result.filter((res) => {
        return String(res.nse_date) == String(result[result.length - 1].nse_date);
      });
      var temp;
      for (i = 0; i < final.length; i++) {
        temp = result.filter(res => {
          return res.company_name == final[i].company_name;
        });
        final[i].closeavgdiff = 0;
        final[i].nseperavgdiff = 0;
        final[i].bseperavgdiff = 0;
        final[i].nsedelvavgdiff = 0;
        final[i].bsedelvavgdiff = 0;
        for (var j = 0; j < temp.length; j++) {
          final[i].closeavgdiff += temp[j].nse_close;
          final[i].nseperavgdiff += temp[j].nse_percentage_of_deliverable_quantity_to_traded_quantity;
          final[i].bseperavgdiff += temp[j].bse_delv_per;
          final[i].nsedelvavgdiff += temp[j].nse_deliverable_quantity;
          final[i].bsedelvavgdiff += temp[j].bse_delivery_quantity;
        }
        final[i].closeavgdiff = (final[i].nse_close - final[i].closeavgdiff / temp.length).toFixed(2);
        final[i].nseperavgdiff = (final[i].nse_percentage_of_deliverable_quantity_to_traded_quantity - final[i].nseperavgdiff / temp.length).toFixed(2);
        final[i].bseperavgdiff = (final[i].bse_delv_per - final[i].bseperavgdiff / temp.length).toFixed(2);
        final[i].nsedelvavgdiff = (final[i].nse_deliverable_quantity - final[i].nsedelvavgdiff / temp.length).toFixed(2);
        final[i].bsedelvavgdiff = (final[i].bse_delivery_quantity - final[i].bsedelvavgdiff / temp.length).toFixed(2);
      }
      res.render('report1', {
        user: req.user,
        data: final,
        params: param
      });
    });
  });
});

searchRouter.post('/report1', isLoggedIn, function(req, res, next) {
  var query = {};
  query.$and = [];
  param = {};
  var from = new Date();
  var dd = String(req.body.date[3] + req.body.date[4]);
  var mm = String(parseInt(req.body.date[0] + req.body.date[1]) - 1); //January is 0!
  var yyyy = String(req.body.date[6] + req.body.date[7] + req.body.date[8] + req.body.date[9]);
  from = new Date(yyyy, mm, dd);
  dd = String(req.body.enddate[3] + req.body.enddate[4]);
  mm = String(parseInt(req.body.enddate[0] + req.body.enddate[1]) - 1); //January is 0!
  yyyy = String(req.body.enddate[6] + req.body.enddate[7] + req.body.enddate[8] + req.body.enddate[9]);
  var to = new Date(yyyy, mm, dd);
  if (req.body.date !== '' && req.body.date !== undefined && req.body.enddate !== '' && req.body.enddate !== undefined) {
    param.date = from;
    param.enddate = to;
    query.$and.push({
      date: {
        $lte: to,
        $gte: from
      }
    });
  }
  mm = String(parseInt(req.body.date[0] + req.body.date[1]) + 1);
  from = new Date(yyyy, mm, dd);
  mm = String(parseInt(req.body.enddate[0] + req.body.enddate[1]) + 1);
  to = new Date(yyyy, mm, dd);
  query.$and.push({
    company_name: {
      $in: req.user.scripts
    }
  });
  nseModel.find(query, async (err, nsedata) => {
    await bseModel.find(query, async (err, bsedata) => {
      var result = [];
      for (var i = 0; i < nsedata.length; i++) {
        for (var j = 0; j < bsedata.length; j++) {
          if (bsedata[j].company_name == nsedata[i].company_name && String(bsedata[j].date) == String(nsedata[i].date)) {
            result.push({
              name_of_security: nsedata[i].name_of_security,
              nse_quantity_traded: nsedata[i].quantity_traded,
              nse_deliverable_quantity: nsedata[i].deliverable_quantity,
              nse_percentage_of_deliverable_quantity_to_traded_quantity: nsedata[i].percentage_of_deliverable_quantity_to_traded_quantity,
              nse_close: nsedata[i].close,
              nse_date: nsedata[i].date,
              company_name: nsedata[i].company_name,
              bse_delivery_quantity: bsedata[j].delivery_quantity,
              bse_day_volume: bsedata[j].day_volume,
              bse_delv_per: bsedata[j].delv_per,
            });
          }
        }
      }
      var final = result.filter((res) => {
        return String(res.nse_date) == String(result[result.length - 1].nse_date);
      });
      for (var i = 0; i < final.length; i++) {
        var temp = result.filter(res => {
          return res.company_name == final[i].company_name;
        });
        final[i].closeavgdiff = 0;
        final[i].nseperavgdiff = 0;
        final[i].bseperavgdiff = 0;
        final[i].nsedelvavgdiff = 0;
        final[i].bsedelvavgdiff = 0;
        for (var j = 0; j < temp.length; j++) {
          final[i].closeavgdiff += temp[j].nse_close;
          final[i].nseperavgdiff += temp[j].nse_percentage_of_deliverable_quantity_to_traded_quantity;
          final[i].bseperavgdiff += temp[j].bse_delv_per;
          final[i].nsedelvavgdiff += temp[j].nse_deliverable_quantity;
          final[i].bsedelvavgdiff += temp[j].bse_delivery_quantity;
        }
        final[i].closeavgdiff = (final[i].nse_close - final[i].closeavgdiff / temp.length).toFixed(2);
        final[i].nseperavgdiff = (final[i].nse_percentage_of_deliverable_quantity_to_traded_quantity - final[i].nseperavgdiff / temp.length).toFixed(2);
        final[i].bseperavgdiff = (final[i].bse_delv_per - final[i].bseperavgdiff / temp.length).toFixed(2);
        final[i].nsedelvavgdiff = (final[i].nse_deliverable_quantity - final[i].nsedelvavgdiff / temp.length).toFixed(2);
        final[i].bsedelvavgdiff = (final[i].bse_delivery_quantity - final[i].bsedelvavgdiff / temp.length).toFixed(2);
      }
      res.render('report1', {
        user: req.user,
        data: final,
        params: param
      });
    });
  });
});

searchRouter.get('/report2', isLoggedIn, function(req, res) {
  var query = {};
  param = {};
  query.$and = [];
  var from = new Date();
  var dd = String(from.getDate()).padStart(2, '0');
  var mm = String(from.getMonth()).padStart(2, '0'); //January is 0!
  var yyyy = from.getFullYear();
  from = new Date(yyyy, mm, dd);
  // var to = new Date(from.getTime() - (24 * 60 * 60 * 1000) * 8);
  var to = from;
  param.date = from;
  param.enddate = from;
  query.$and.push({
    date: {
      $lte: from,
      $gte: to
    }
  });
  mm = String(from.getMonth() + 1).padStart(2, '0');
  from = new Date(yyyy, mm, dd);
  to = from;
  query.$and.push({
    company_name: {
      $in: req.user.scripts
    }
  });
  nseModel.find(query, async (err, nsedata) => {
    await bseModel.find(query, async (err, bsedata) => {
      var result = [];
      var data = {};
      for (var i = 0; i < nsedata.length; i++) {
        for (var j = 0; j < bsedata.length; j++) {
          if (bsedata[j].company_name == nsedata[i].company_name && String(bsedata[j].date) == String(nsedata[i].date)) {
            data = {
              name_of_security: nsedata[i].name_of_security,
              nse_quantity_traded: nsedata[i].quantity_traded,
              nse_deliverable_quantity: nsedata[i].deliverable_quantity,
              nse_percentage_of_deliverable_quantity_to_traded_quantity: nsedata[i].percentage_of_deliverable_quantity_to_traded_quantity,
              nse_close: nsedata[i].close,
              nse_date: nsedata[i].date,
              company_name: nsedata[i].company_name,
              bse_delivery_quantity: bsedata[j].delivery_quantity,
              bse_day_volume: bsedata[j].day_volume,
              bse_delv_per: bsedata[j].delv_per,
            };
            await result.push(data);
          }
        }
      }
      var final = result.filter((res) => {
        return String(res.nse_date) == String(result[result.length - 1].nse_date);
      });
      var result1 = [];
      for (i = 0; i < result.length; i++) {
        var temp = result.filter(res => {
          return res.company_name == final[i].company_name;
        });
        result1.push(...temp);
        for (var j = 0; j < temp.length; j++) {
          result1[i * temp.length + j].closeavgdiff = (final[i].nse_close - result1[i * temp.length + j].nse_close).toFixed(2);
          result1[i * temp.length + j].nseperavgdiff = (final[i].nse_percentage_of_deliverable_quantity_to_traded_quantity - result1[i * temp.length + j].nse_percentage_of_deliverable_quantity_to_traded_quantity).toFixed(2);
          result1[i * temp.length + j].bseperavgdiff = (final[i].bse_delv_per - result1[i * temp.length + j].bse_delv_per).toFixed(2);
          result1[i * temp.length + j].nsedelvavgdiff = (final[i].nse_deliverable_quantity - result1[i * temp.length + j].nse_deliverable_quantity).toFixed(2);
          result1[i * temp.length + j].bsedelvavgdiff = (final[i].bse_delivery_quantity - result1[i * temp.length + j].bse_delivery_quantity).toFixed(2);
        }
      }
      res.render('report2', {
        user: req.user,
        data: result1,
        params: param
      });
    });
  });
});

searchRouter.post('/report2', isLoggedIn, function(req, res, next) {
  var query = {};
  query.$and = [];
  param = {};
  var from = new Date();
  var dd = String(req.body.date[3] + req.body.date[4]);
  var mm = String(parseInt(req.body.date[0] + req.body.date[1]) - 1); //January is 0!
  var yyyy = String(req.body.date[6] + req.body.date[7] + req.body.date[8] + req.body.date[9]);
  from = new Date(yyyy, mm, dd);
  dd = String(req.body.enddate[3] + req.body.enddate[4]);
  mm = String(parseInt(req.body.enddate[0] + req.body.enddate[1]) - 1); //January is 0!
  yyyy = String(req.body.enddate[6] + req.body.enddate[7] + req.body.enddate[8] + req.body.enddate[9]);
  var to = new Date(yyyy, mm, dd);
  if (req.body.date !== '' && req.body.date !== undefined && req.body.enddate !== '' && req.body.enddate !== undefined) {
    param.date = from;
    param.enddate = to;
    query.$and.push({
      date: {
        $lte: to,
        $gte: from
      }
    });
  }
  mm = String(parseInt(req.body.date[0] + req.body.date[1]) + 1);
  from = new Date(yyyy, mm, dd);
  mm = String(parseInt(req.body.enddate[0] + req.body.enddate[1]) + 1);
  to = new Date(yyyy, mm, dd);
  query.$and.push({
    company_name: {
      $in: req.user.scripts
    }
  });
  nseModel.find(query, async (err, nsedata) => {
    await bseModel.find(query, async (err, bsedata) => {
      var result = [];
      for (var i = 0; i < nsedata.length; i++) {
        for (var j = 0; j < bsedata.length; j++) {
          if (bsedata[j].company_name == nsedata[i].company_name && String(bsedata[j].date) == String(nsedata[i].date)) {
            result.push({
              name_of_security: nsedata[i].name_of_security,
              nse_quantity_traded: nsedata[i].quantity_traded,
              nse_deliverable_quantity: nsedata[i].deliverable_quantity,
              nse_percentage_of_deliverable_quantity_to_traded_quantity: nsedata[i].percentage_of_deliverable_quantity_to_traded_quantity,
              nse_close: nsedata[i].close,
              nse_date: nsedata[i].date,
              company_name: nsedata[i].company_name,
              bse_delivery_quantity: bsedata[j].delivery_quantity,
              bse_day_volume: bsedata[j].day_volume,
              bse_delv_per: bsedata[j].delv_per,
            });
          }
        }
      }
      var final = result.filter((res) => {
        return String(res.nse_date) == String(result[result.length - 1].nse_date);
      });
      var result1 = [];
      for (var i = 0; i < final.length; i++) {
        var temp = result.filter(res => {
          return res.company_name == final[i].company_name;
        });
        result1.push(...temp);
        for (var j = 0; j < temp.length; j++) {
          result1[i * temp.length + j].closeavgdiff = (final[i].nse_close - result1[i * temp.length + j].nse_close).toFixed(2);
          result1[i * temp.length + j].nseperavgdiff = (final[i].nse_percentage_of_deliverable_quantity_to_traded_quantity - result1[i * temp.length + j].nse_percentage_of_deliverable_quantity_to_traded_quantity).toFixed(2);
          result1[i * temp.length + j].bseperavgdiff = (final[i].bse_delv_per - result1[i * temp.length + j].bse_delv_per).toFixed(2);
          result1[i * temp.length + j].nsedelvavgdiff = (final[i].nse_deliverable_quantity - result1[i * temp.length + j].nse_deliverable_quantity).toFixed(2);
          result1[i * temp.length + j].bsedelvavgdiff = (final[i].bse_delivery_quantity - result1[i * temp.length + j].bse_delivery_quantity).toFixed(2);
        }
      }
      res.render('report2', {
        user: req.user,
        data: result1,
        params: param
      });
    });
  });
});

function isLoggedIn(req, res, next) {
  try {
    if (req.isAuthenticated()) {
      req.isLogged = true;
      return next();
    }
    res.redirect('/');
  } catch (e) {
    console.log(e);
  }
}

module.exports = searchRouter;
