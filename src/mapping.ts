import { near, BigInt, log, Bytes, json, JSONValue, TypedMap } from "@graphprotocol/graph-ts"
import {  ReceiptEvent,ExecutionOutcome,FunctionCallActionEvent,FunctionCallPermissionEvent,TransferActionEvent,BlockEvent} from "../generated/schema";
 
export function handleReceipt(receipt: near.ReceiptWithOutcome): void {
  const receiptId = receipt.receipt.id.toBase58()
  const status = receipt.outcome.status
  
  const outcome = new ExecutionOutcome(receiptId)
  outcome.blockHash = receipt.outcome.blockHash.toBase58()
  outcome.logs = receipt.outcome.logs
  outcome.receiptIds = bytesArrayToStringArray(receipt.outcome.receiptIds)
  outcome.tokensBurnt = receipt.outcome.tokensBurnt
  outcome.executorId = receipt.outcome.executorId
  outcome.status = status.kind
  outcome.save()
 
  const event = new ReceiptEvent(receiptId)
  event.blockHeight = BigInt.fromU64(receipt.block.header.height)
  event.outcome = outcome.id
  event.predecessorId = receipt.receipt.predecessorId
  event.receiverId = receipt.receipt.receiverId
  event.signerId = receipt.receipt.signerId
  event.save()
 
  const actions = receipt.receipt.actions
     for (let i = 0; i < actions.length; i++) {
    handleAction(i, actions[i],receiptId)
  }
}
 
  function handleAction(index: i32, action: near.ActionValue, receiptId: string): void {
    
    if (action.kind == near.ActionKind.FUNCTION_CALL) {
      const value = action.toFunctionCall()
      const event = new FunctionCallActionEvent(receiptId + "-" + index.toString())
      event.method = value.methodName
      event.args = value.args
      event.deposit = value.deposit
 
      event.save()

      return
    }

    if (action.kind == near.ActionKind.TRANSFER) {
      const event = new TransferActionEvent(receiptId + "-" + index.toString())
      event.save()
  
      return
    }
    // if (access.kind == near.AccessKeyPermissionKind.FUNCTION_CALL) {
    //   const value = access.toFunctionCall()
    //   const event = new FunctionCallPermissionEvent(receiptId + "-" + index.toString())
    //   event.allowance = value.allowance
    //   event.receiverId = value.receiverId
    //   event.save()

    //   return
    // }
 
 }

 export function handleBlock(block: near.Block): void {
  const header = block.header;
  let event = new BlockEvent(header.hash.toHexString());
  event.timestampNanosec = BigInt.fromU64(header.timestampNanosec);
  event.gasPrice = header.gasPrice;
  event.totalsupply = header.totalSupply;
  event.save()
 }
  function bytesArrayToStringArray(values: Bytes[]): string[] {
  const strings: string[] = []
  for (let i = 0; i < values.length; i++) {
    strings.push(values[i].toBase58())
  }
  return strings
}
