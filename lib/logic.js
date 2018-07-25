'use strict';


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
      insuranceAsset.notary = insurance.notary
      insuranceAsset.insured = insurance.insured
      insuranceAsset.insuranceCompany = insurance.insuranceCompany
      insuranceAsset.ipEstate = insurance.ipEstate
      insuranceAsset.durationInMonths = insurance.durationInMonths
      insuranceAsset.monthlyCost = insurance.monthlyCost

      return assetRegistry.add(insuranceAsset)
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
 * Buying Ip Estate
 * @param {org.acme.ipregistry.BuyingIPEstate} trade
 * @transaction
 */

function buyingIPEstate( trade ){
  var ipEstateAgentFees = trade.ipEstateAgent.feeRate * trade.ipEstate.price
  var insuranceCostFirstMonth = trade.insurance.monthlyCost
  var totalCost = ipEstateAgentFees + insuranceCostFirstMonth + trade.ipEstate.price
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