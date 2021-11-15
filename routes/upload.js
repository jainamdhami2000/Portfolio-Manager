//jshint esversion:8

require("dotenv").config();
const express = require('express');
const router = express.Router();
const multer = require('multer');
const master = require('../model/master');
const nseModel = require('../model/nsescript');
const bseModel = require('../model/bsescript');
const searchModel = require('../model/search');
const csv = require('csvtojson');
const User = require('../model/user');
const fs = require('fs');

var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

var uploads = multer({
    storage: storage
});

router.get('/', isLoggedIn,(req, res) => {
    nseModel.find((err, nsedata) => {
        bseModel.find((err, bsedata) => {
            // for (var i = 0; i < nsedata.length; i++) {
            //   for (var j = 0; j < bsedata.length; j++) {
            //     if (nsedata[i].company_name==bsedata[j].company_name){
            //       var data = {
            //         name_of_security: nsedata[i].name_of_security,
            //         nse_quantity_traded: nsedata[i].quantity_traded,
            //         nse_deliverable_quantity: nsedata[i].deliverable_quantity,
            //         nse_percentage_of_deliverable_quantity_to_traded_quantity: nsedata[i].percentage_of_deliverable_quantity_to_traded_quantity,
            //         nse_close: nsedata[i].close,
            //         date: nsedata[i].date,
            //         company_name: nsedata[i].company_name,
            //         bse_delivery_quantity: bsedata[j].deliverable_quantity,
            //         bse_day_volume: bsedata[j].day_volume,
            //         bse_delv_per: bsedata[j].delv_per,
            //       }
            //       searchModel.findOne(data, (err, found) => {
            //         if (!found) {
            //           console.log(data.name_of_security)
            //           var datas = new searchModel({
            //             name_of_security: data.name_of_security,
            //             nse_quantity_traded: data.quantity_traded,
            //             nse_deliverable_quantity: data.deliverable_quantity,
            //             nse_percentage_of_deliverable_quantity_to_traded_quantity: data.percentage_of_deliverable_quantity_to_traded_quantity,
            //             nse_close: data.close,
            //             date: data.date,
            //             company_name: data.company_name,
            //             bse_delivery_quantity: data.deliverable_quantity,
            //             bse_day_volume: data.day_volume,
            //             bse_delv_per: data.delv_per,
            //           });
            //           datas.save();
            //         }
            //       });
            //       break;
            //     }
            //   }
            // }
            // nsedata.forEach(nse=>{
            //   bsedata.forEach(bse=>{
            //     data = {
            //       name_of_security: nse.name_of_security,
            //       nse_quantity_traded: nse.quantity_traded,
            //       nse_deliverable_quantity: nse.deliverable_quantity,
            //       nse_percentage_of_deliverable_quantity_to_traded_quantity: nse.percentage_of_deliverable_quantity_to_traded_quantity,
            //       nse_close: nse.close,
            //       date: nse.date,
            //       company_name: nse.company_name,
            //       bse_delivery_quantity: bse.deliverable_quantity,
            //       bse_day_volume: bse.day_volume,
            //       bse_delv_per: bse.delv_per,
            //     }
            //     searchModel.findOne(data,(err,found)=>{
            //       if(!found){
            //         var data = new searchModel({
            //           name_of_security: nse.name_of_security,
            //           nse_quantity_traded: nse.quantity_traded,
            //           nse_deliverable_quantity: nse.deliverable_quantity,
            //           nse_percentage_of_deliverable_quantity_to_traded_quantity: nse.percentage_of_deliverable_quantity_to_traded_quantity,
            //           nse_close: nse.close,
            //           date: nse.date,
            //           company_name: nse.company_name,
            //           bse_delivery_quantity: bse.deliverable_quantity,
            //           bse_day_volume: bse.day_volume,
            //           bse_delv_per: bse.delv_per,
            //         });
            //         data.save();
            //       }
            //     });
            //   });
            // });

            if (err) {
                console.log(err);
            } else {
                if (nsedata == '' && bsedata == '') {
                    res.render('upload', {
                        nsedata: '',
                        bsedata: '',
                        user: req.user
                    });
                } else if (bsedata != '') {
                    res.render('upload', {
                        bsedata: bsedata,
                        nsedata: '',
                        user: req.user
                    });
                } else if (nsedata != '') {
                    res.render('upload', {
                        nsedata: nsedata,
                        bsedata: '',
                        user: req.user
                    });
                }
            }
        });
    });
});

router.post('/addscript', isLoggedIn, (req, res) => {
    User.findOne({_id: req.user._id}, (err, user) => {
        user.scripts = req.body.scripts;
        req.user.scripts = req.body.scripts;
        user.save();
    })
    res.redirect('/upload')
});

router.post('/deletescript', isLoggedIn, (req, res) => {
    User.findOne({_id: req.user._id}, (err, user) => {
        var scriptarray = user.scripts;
        var result = scriptarray.filter(script=>{
            return script!=req.body.deletedscript
        });
        user.scripts = result;
        req.user.scripts = result;
    });
    res.redirect('/upload')
});

router.get('/getscripts', isLoggedIn, (req, res) => {
    master.find({}, (err, scripts) => {
        if (err) {
            res.send(err);
        } else {
            res.send(scripts);
        }
    });
});

router.post('/nse', uploads.fields([{
    name: 'nse',
    maxCount: 1
}, {
    name: 'close',
    maxCount: 1
}]), (req, res) => {
    // console.log(req.files)
    fs.readFile(req.files.nse[0].path, function (err, data) { // read file to memory
        if (!err) {
            data = data.toString(); // stringify buffer
            for (var i = 0; i < 4; i++) {
                var position = data.toString().indexOf('\n'); // find position of new line element
                data = data.substr(position + 1); // subtract string based on first line length
            }
            data = 'Record Type,Sr No,Name of Security,Settlement Type,Quantity Traded,Deliverable Quantity(gross across client level),% of Deliverable Quantity to Traded Quantity\n' + data;
            fs.writeFile(req.files.nse[0].path, data, function (err) { // write file
                if (err) { // if error, report
                    console.log(err);
                }
            });
        } else {
            console.log(err);
        }
        // fs.writeFile(req.file.path, result, 'utf8', function(err) {
        //   if (err) return console.log(err);
        // });
        //convert csvfile to jsonArray
        csv()
            .fromFile(req.files.nse[0].path)
            .then((jsonObj) => {
                csv()
                    .fromFile(req.files.close[0].path)
                    .then((closejsonObj) => {
                        // console.log(jsonObj.length);
                        var final = [];
                        //the jsonObj will contain all the data in JSONFormat.
                        //but we want columns Test1,Test2,Test3,Test4,Final data as number .
                        //becuase we set the dataType of these fields as Number in our mongoose.Schema().
                        //here we put a for loop and change these column value in number from string using parseFloat().
                        //here we use parseFloat() beause because these fields contain the float values.

                        // MTO_18092020.DAT
                        d = req.files.nse[0].originalname;
                        var today = new Date();
                        // var dd = String(today.getDate()).padStart(2, '0');
                        // var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                        // var yyyy = today.getFullYear();
                        var dd = d[4] + d[5];
                        var mm = String(parseInt(d[6] + d[7])-1);
                        var yyyy = d[8] + d[9] + d[10] + d[11];
                        today = new Date(yyyy, mm, dd);
                        for (var x = 0; x < jsonObj.length; x++) {
                            final[x] = {};
                            final[x].record_type = jsonObj[x]['Record Type'];
                            final[x].name_of_security = jsonObj[x]['Name of Security'];
                            final[x].settlement_type = jsonObj[x]['Settlement Type'];
                            final[x].quantity_traded = jsonObj[x]['Quantity Traded'];
                            final[x].deliverable_quantity = jsonObj[x]['Deliverable Quantity(gross across client level)'];
                            final[x].percentage_of_deliverable_quantity_to_traded_quantity = jsonObj[x]['% of Deliverable Quantity to Traded Quantity'];
                            final[x].date = today;
                        }
                        //insertmany is used to save bulk data in database.
                        //saving the data in collection(table)
                        master.find({}, async (err, masters) => {
                            for (var i = 0; i < final.length; i++) {
                                for (var j = 0; j < masters.length; j++) {
                                    if (masters[j].symbol == final[i].name_of_security) {
                                        final[i].company_name = masters[j].company_name;
                                        final[i].script_code = masters[j].script_code;
                                        break;
                                    }
                                }
                            }
                            for (var a = 0; a < final.length; a++) {
                                for (var b = 0; b < closejsonObj.length; b++) {
                                    if (final[a].name_of_security == closejsonObj[b].SYMBOL) {
                                        final[a].close = closejsonObj[b].CLOSE;
                                        break;
                                    }
                                }
                            }
                            console.log(final[0])
                            // console.log({date:final[0].date,name_of_security:final[0].name_of_security})
                            await nseModel.findOne({
                                date: final[0].date,
                                name_of_security: final[0].name_of_security
                            }, async (err, found) => {
                                if (!found) {
                                    await nseModel.insertMany(final, (err, nsedata) => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                                res.redirect('/upload')
                            })
                            // nseModel.insertMany(final, (err, nsedata) => {
                            //   if (err) {
                            //     console.log(err);
                            //   } else {
                            //     res.redirect('/upload');
                            //   }
                            // });
                            // var duplicates = []
                            // await nseModel.aggregate(
                            //     [{
                            //         $group: {
                            //           _id: {
                            //             date: "$date",
                            //             name_of_security: "$name_of_security"
                            //           },
                            //           dups: {
                            //             $addToSet: "$_id"
                            //           },
                            //           count: {
                            //             $sum: 1
                            //           }
                            //         }
                            //       },
                            //       {
                            //         $match: {
                            //           count: {
                            //             $gt: 1
                            //           }
                            //         }
                            //       }
                            //     ])
                            //   .forEach(function(doc) {
                            //     doc.dups.shift(); // First element skipped for deleting and important line here
                            //     doc.dups.forEach(function(dupId) {
                            //       duplicates.push(dupId); // Getting all duplicate ids
                            //     })
                            //   });
                            //   console.log(duplicates)
                            // // await bseModel.aggregate()
                        });
                    });
            });
    });
});

router.post('/bse', uploads.single('bse'), (req, res) => {
    fs.readFile(req.file.path, 'utf8', function (err, data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/[|]/g, ',');
        fs.writeFile(req.file.path, result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
        csv()
            .fromFile(req.file.path)
            .then((jsonObj) => {
                var final = [];
                //the jsonObj will contain all the data in JSONFormat.
                //but we want columns Test1,Test2,Test3,Test4,Final data as number .
                //becuase we set the dataType of these fields as Number in our mongoose.Schema().
                //here we put a for loop and change these column value in number from string using parseFloat().
                //here we use parseFloat() beause because these fields contain the float values.
                var today = new Date();
                // var dd = String(today.getDate()).padStart(2, '0');
                // var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
                // var yyyy = today.getFullYear();
                var d = jsonObj[0].DATE;
                var dd = d[0] + d[1];
                var mm = String(parseInt(d[2] + d[3])-1);
                var yyyy = d[4] + d[5] + d[6] + d[7];
                today = new Date(yyyy, mm, dd);
                for (var x = 0; x < jsonObj.length; x++) {
                    final[x] = {};
                    final[x].script_code = jsonObj[x]['SCRIP CODE'];
                    final[x].delivery_quantity = jsonObj[x]['DELIVERY QTY'];
                    final[x].delivery_val = jsonObj[x]['DELIVERY VAL'];
                    final[x].day_volume = jsonObj[x]["DAY'S VOLUME"];
                    final[x].day_turnover = jsonObj[x]["DAY'S TURNOVER"];
                    final[x].delv_per = jsonObj[x]['DELV. PER.'];
                    final[x].date = today;
                }
                console.log('final', final[0]);
                //insertmany is used to save bulk data in database.
                //saving the data in collection(table)
                master.find({}, async (err, masters) => {
                    for (var i = 0; i < final.length; i++) {
                        for (var j = 0; j < masters.length; j++) {
                            if (masters[j].script_code == final[i].script_code) {
                                final[i].symbol = masters[j].symbol;
                                final[i].company_name = masters[j].company_name;
                                break;
                            }
                        }
                    }
                    await bseModel.findOne({
                        date: final[0].date,
                        script_code: final[0].script_code
                    }, async (err, found) => {
                        if (!found) {
                            await bseModel.insertMany(final, (err, nsedata) => {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        res.redirect('/upload');
                    });
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

module.exports = router;
