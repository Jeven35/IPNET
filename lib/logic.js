'use strict';

/**
 * Buying Ip Estate
 * @param {org.acme.ipregistry.BuyingIPEstate} trade
 * @transaction
 */

function buyingIPEstate( trade ){
  var ipEstateAgentFees = trade.ipEstateAgent.feeRate * trade.ipEstate.price
  var totalCost = ipEstateAgentFees + trade.ipEstate.price
  // Updates the seller's balance
  trade.seller.balance += trade.ipEstate.price

  // Check if the buyer has enough to pay the notary, real estate agent and insurance
  if( trade.buyer.balance < totalCost ){
    throw new Error('Not enough funds to buy this!')
  }
  trade.buyer.balance -= totalCost
  trade.ipEstate.owner = trade.buyer
  trade.ipEstateAgent.balance += ipEstateAgentFees

  Promise.all([
    getAssetRegistry('org.acme.ipregistry.IPEstate'),
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.RealEstateAgent')
  ]).then(function(registries){
    return (
      registries[0].update(trade.ipEstate),
      registries[1].update(trade.seller),
      registries[2].update(trade.buyer),
      registries[3].update(trade.ipEstateAgent)
    )
  })
}


/**
 * Contracting an insurance
 * @param {org.acme.ipregistry.ContractingInsurance} insurance
 * @transaction
 */

 function contractingInsurance( insurance ){
    return getAssetRegistry('org.acme.ipregistry.Insurance')
      .then(function(assetRegistry){
      var factory = getFactory()
      var insuranceId = insurance.notary.id + ' '+ insurance.insured.id + '' + insurance.insuranceCompany.id + '' + insurance.ipEstate.id
      var insuranceAsset = factory.newResource('org.acme.ipregistry', 'Insurance', insuranceId)
      insuranceAsset.loan = insurance.loan
      insuranceAsset.insured = insurance.insured
      insuranceAsset.insuranceCompany = insurance.insuranceCompany
      insuranceAsset.ipEstate = insurance.ipEstate
      insuranceAsset.durationInMonths = insurance.durationInMonths
      insuranceAsset.monthlyCost = insurance.monthlyCost

      return assetRegistry.add(insuranceAsset)
    })
 }


 /**
 * Compensating an insurance
 * @param {org.acme.ipregistry.CompensatingInsurance} compensatinginsurance
 * @transaction
 */

 function compensatingInsurance( compensatinginsurance ){
  var insurance = compensatinginsurance.insurance
  // Updates the seller's balance
  var payment = compensatinginsurance.compensation
  insurance.insured.balance += payment
  // Check if the buyer has enough to pay the notary, real estate agent and insurance
  if( insurance.insuranceCompany.balance < payment ){
    throw new Error('Not enough funds to compensate this!')
  }
  insurance.insuranceCompany.balance -= payment
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.InsuranceCompany')
  ]).then(function(registries){
    return (
      registries[0].update(insurance.insured),
      registries[1].update(insurance.insuranceCompany),
    )
  })
 }


/**
 * Contracting a loan
 * @param {org.acme.ipregistry.ContractingLoan} loan
 * @transaction
 */

function contractingLoan( loan ){
  return getAssetRegistry('org.acme.ipregistry.Loan')
    .then(function(assetRegistry){
    var factory = getFactory()
    var loanId = loan.debtor.id + '' + loan.ipEstate.id + '' + loan.bank.id
    var loanAsset = factory.newResource('org.acme.ipregistry', 'Loan', loanId) 
    loanAsset.debtor = loan.debtor
    loanAsset.bank = loan.bank
    loanAsset.interestRate = loan.interestRate
    loanAsset.durationInMonths = loan.durationInMonths
    loanAsset.ipEstate = loan.ipEstate
    loanAsset.amount = loan.ipEstate.price
    // loan.ipEstate.status = PLEDGE
    return assetRegistry.add(loanAsset)
  })
}

 /**
 * paying a loan
 * @param {org.acme.ipregistry.PayingLoan} payingloan
 * @transaction
 */

 function payingLoan( payingloan ){
  var loan = payingloan.loan
  // Updates the seller's balance
  var payment = payingloan.payment

  if( loan.debtor.balance < payment ){
    throw new Error('Not enough funds to pay this!')
  }
  loan.debtor.balance -= payment
  loan.bank.balance += payment
  Promise.all([
    getParticipantRegistry('org.acme.ipregistry.PrivateIndividual'),
    getParticipantRegistry('org.acme.ipregistry.Bank')
  ]).then(function(registries){
    return (
      registries[0].update(loan.debtor),
      registries[1].update(loan.bank),
    )
  })
 }
